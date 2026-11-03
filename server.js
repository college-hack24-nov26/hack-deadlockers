// Signaling server: relays signaling between peers and proxies AI analysis to Python service
const express = require('express');
const http = require('http');
const { WebSocket, WebSocketServer } = require('ws');

const app = express();
app.use(express.static(require('path').join(__dirname, 'public')));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const peers = new Map(); // id -> ws

wss.on('connection', (ws, req) => {
  const url = req.url || '';

  // Proxy AI analysis WebSocket connections directly to Python FastAPI on port 8000
  if (url.startsWith('/ws/analyze/')) {
    const aiBackendUrl = 'ws://localhost:8000' + url;
    let aiWs;
    try {
      aiWs = new WebSocket(aiBackendUrl);
      const queue = [];

      ws.on('message', (data, isBinary) => {
        if (aiWs.readyState === WebSocket.OPEN) {
          aiWs.send(data, { binary: isBinary });
        } else if (aiWs.readyState === WebSocket.CONNECTING) {
          queue.push({ data, isBinary });
        }
      });

      aiWs.on('open', () => {
        while (queue.length > 0) {
          const item = queue.shift();
          aiWs.send(item.data, { binary: item.isBinary });
        }
      });

      aiWs.on('message', (data, isBinary) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data, { binary: isBinary });
        }
      });

      aiWs.on('error', (err) => {
        console.warn('AI backend proxy error:', err.message);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'status', state: 'error', message: 'AI backend offline' }));
        }
      });

      ws.on('close', () => {
        if (aiWs.readyState === WebSocket.OPEN || aiWs.readyState === WebSocket.CONNECTING) {
          aiWs.close();
        }
      });

      aiWs.on('close', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    } catch (err) {
      console.warn('Failed to connect to AI backend:', err.message);
    }
    return;
  }

  // Peer-to-peer WebRTC signaling logic
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'register') {
      if (peers.has(m.id) && peers.get(m.id) !== ws) return ws.send(JSON.stringify({ type: 'error', msg: 'ID already in use' }));
      ws.id = m.id; peers.set(m.id, ws);
      return ws.send(JSON.stringify({ type: 'registered', id: m.id }));
    }
    if (!ws.id) return;
    const target = peers.get(m.to);
    if (!target) return ws.send(JSON.stringify({ type: 'unavailable', to: m.to }));
    target.send(JSON.stringify({ ...m, from: ws.id })); // offer/answer/ice/reject/hangup
  });
  ws.on('close', () => { if (ws.id && peers.get(ws.id) === ws) peers.delete(ws.id); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Running on http://localhost:' + PORT));
