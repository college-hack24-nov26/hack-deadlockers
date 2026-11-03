// Signaling server: only relays messages between peers. Audio flows peer-to-peer.
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
app.use(express.static(require('path').join(__dirname, 'public')));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const peers = new Map(); // id -> ws

wss.on('connection', (ws) => {
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
