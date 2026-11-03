# ScamChain — Deployment Guide

## Verified Test Results

| Test | Result |
|---|---|
| Step 1: AudioWorklet + WS byte counter | PASS |
| Risk monotonically escalates for scam calls | PASS |
| Benign calls stay Low | PASS |
| Sensitive-ask floor rule (OTP after authority) | PASS |
| Sequence analyzer detects digital_arrest_flow | PASS |
| Alert generator generates correct level messages | PASS |
| E2E real-time WebSocket audio streaming | PASS |

**Scam call risk progression (CBI + OTP):**
```
T=5s   → 39.5  (Medium)   [authority impersonation detected]
T=14s  → 73.3  (High)     [fear manipulation added]
T=22s  → 96.0  (Critical) [digital arrest]
T=31s  → 99.4  (Critical) [urgency + multi-stage escalation]
T=40s  → 99.9  (Critical) [financial manipulation - stage 4]
T=48s  → 100.0 (Critical) [OTP request - sensitive ask floor]
```

---

## Gemini API Key Setup

Your Gemini API key appears to be getting truncated in chat. To set it correctly:

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Copy the full key (it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`, exactly 39 chars)
3. Edit `ai/.env`:
   ```
   LLM_PROVIDER=gemini_free
   GEMINI_API_KEY=AIzaSyYOURFULLKEYHERE
   ```

---

## Deployment Options

### Option A — Deploy on Railway (Recommended, FREE tier)

Railway auto-detects Python/Node apps and gives you a free HTTPS domain (needed for mobile WebRTC mic access).

#### 1. Push code to GitHub
```cmd
cd hack-deadlockers
git checkout -b feat/ai-scam-shield
git add .
git commit -m "feat: add real-time AI scam-call detection"
git push -u origin feat/ai-scam-shield
```

#### 2. Deploy Node.js Signaling Server
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo → set **Root Directory** = `hack-deadlockers`
3. Railway auto-detects `package.json` → sets `npm start`
4. Add environment variable: `PORT=3000`
5. Note the generated HTTPS domain: `https://your-app.railway.app`

#### 3. Deploy FastAPI AI Service (second Railway service)
1. In the same Railway project → **New Service** → same GitHub repo
2. Set **Root Directory** = `hack-deadlockers/ai`
3. Set **Start Command**: `.venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000`
   *(Railway uses Linux, so change to: `python -m uvicorn main:app --host 0.0.0.0 --port 8000`)*
4. Add environment variables:
   ```
   LLM_PROVIDER=gemini_free
   GEMINI_API_KEY=AIzaSyYOURFULLKEYHERE
   STT_MODEL_SIZE=small
   ```
5. Note the AI service HTTPS domain: `https://your-ai.railway.app`

#### 4. Update frontend to use production AI URL
In `public/index.html`, update `connectAIWebSocket()`:
```js
const aiHost = location.hostname === 'localhost' 
  ? 'localhost:8000'
  : 'your-ai.railway.app';
const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${aiHost}/ws/analyze/${encodeURIComponent(callId)}`;
```

---

### Option B — Deploy on Render (FREE tier, zero sleep on hobby plan)

#### Node.js Service
1. [render.com](https://render.com) → **New Web Service** → connect GitHub
2. Root: `hack-deadlockers` | Build: `npm install` | Start: `node server.js`

#### FastAPI Service
1. **New Web Service** → same repo
2. Root: `hack-deadlockers/ai` | Build: `pip install -r requirements.txt` | Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
3. Add env vars: `GEMINI_API_KEY`, `LLM_PROVIDER=gemini_free`, `STT_MODEL_SIZE=tiny`

> **Note:** Render free tier sleeps after 15 minutes of inactivity. Use hobby plan ($7/mo) to avoid cold starts on production.

---

### Option C — Expose Local Machine via Cloudflare Tunnel (No server cost, uses your PC)

This is the fastest approach for demos/hackathons:

```cmd
# Terminal 1: Start both services
cd hack-deadlockers
.\start.bat

# Terminal 2: Tunnel Node.js app (gets HTTPS URL for mobile testing)
npx cloudflared tunnel --url http://localhost:3000

# Terminal 3: Tunnel FastAPI AI service
npx cloudflared tunnel --url http://localhost:8000
```

You get two free HTTPS URLs. Update `index.html`'s `connectAIWebSocket()` to use the FastAPI tunnel URL.

---

### Production Checklist

- [ ] HTTPS enabled (required for mobile mic access)
- [ ] `GEMINI_API_KEY` set in server environment (never in frontend)
- [ ] `STT_MODEL_SIZE=small` for best accuracy (or `tiny` for faster cold starts)
- [ ] CORS origins updated in `ai/config.py` to match your deployed Node.js domain
- [ ] `ai/.env` is in `.gitignore` (never commit API keys!)
- [ ] Add TURN server for reliable NAT traversal across networks:
  ```js
  const ICE = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
  ]};
  ```

