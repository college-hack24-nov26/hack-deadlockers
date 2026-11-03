// Signaling server: relays signaling between peers and proxies AI analysis to Python service
const express = require('express');
const http = require('http');
const os = require('os');
const { WebSocket, WebSocketServer } = require('ws');

const app = express();
app.use(express.static(require('path').join(__dirname, 'public')));
app.get('/api/ice', createIceConfigHandler());
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
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Running on http://localhost:' + PORT);
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses || []) {
        if (address.family === 'IPv4' && !address.internal) {
          console.log(`LAN address: http://${address.address}:${PORT}`);
        }
      }
    }
    console.log('Mobile browsers require HTTPS for microphone access; use an HTTPS tunnel for phone calls.');
    console.log(turnUrlsConfigured() ? 'TURN relay configured.' : 'No TURN relay configured; calls may fail across restrictive networks.');
  });
}

function turnUrlsConfigured() {
  return Boolean(
    (process.env.CLOUDFLARE_TURN_KEY_ID && process.env.CLOUDFLARE_TURN_KEY_API_TOKEN) ||
    (process.env.TURN_URLS && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL)
  );
}

function createIceConfigHandler({ env = process.env, fetchImpl = globalThis.fetch, logger = console } = {}) {
  return async (_req, res) => {
    const iceServers = [
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    const cloudflareKeyId = env.CLOUDFLARE_TURN_KEY_ID;
    const cloudflareToken = env.CLOUDFLARE_TURN_KEY_API_TOKEN;
    if (cloudflareKeyId && cloudflareToken && fetchImpl) {
      try {
        const response = await fetchImpl(
          `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(cloudflareKeyId)}/credentials/generate-ice-servers`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cloudflareToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ttl: 86400 })
          }
        );
        if (!response.ok) throw new Error(`Cloudflare TURN returned HTTP ${response.status}`);
        const result = await response.json();
        const cloudflareServers = Array.isArray(result.iceServers) ? result.iceServers : [];
        const turnServers = cloudflareServers
          .filter(server => server && server.urls && server.username && server.credential)
          .map(server => ({
            ...server,
            urls: (Array.isArray(server.urls) ? server.urls : [server.urls])
              // Cloudflare's port 53 alternate can hang in browser ICE gathering.
              .filter(url => typeof url === 'string' && !/:53(?:\?|$)/i.test(url))
          }))
          .filter(server => server.urls.length > 0);
        if (!turnServers.length) throw new Error('Cloudflare returned no usable TURN URLs');
        return res.set('Cache-Control', 'no-store').json({
          iceServers: [...iceServers, ...turnServers],
          turnConfigured: true,
          turnProvider: 'cloudflare'
        });
      } catch (error) {
        // Never include request headers or credentials in logs or client responses.
        logger.warn('Cloudflare TURN credential generation failed:', error.message);
      }
    }

    const turnUrls = (env.TURN_URLS || '').split(';').map(url => url.trim()).filter(Boolean);
    const hasStaticTurn = turnUrls.length > 0 && Boolean(env.TURN_USERNAME) && Boolean(env.TURN_CREDENTIAL);
    if (hasStaticTurn) {
      iceServers.push({ urls: turnUrls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
    }
    return res.set('Cache-Control', 'no-store').json({
      iceServers,
      turnConfigured: hasStaticTurn,
      turnProvider: hasStaticTurn ? 'custom' : null
    });
  };
}

module.exports = { createIceConfigHandler };
