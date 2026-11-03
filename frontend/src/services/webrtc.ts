import { RiskLevel, TacticItem, TranscriptTurn } from '../types';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

export interface WebRTCState {
  myId: string;
  peerId: string;
  callState: 'idle' | 'calling' | 'incoming' | 'connected';
  statusText: string;
  isMuted: boolean;
  durationSec: number;
  audioBytesSent: number;
  audioReceiveBytes: number;
  localLevel: number;
  remoteLevel: number;
  transcripts: TranscriptTurn[];
  tactics: TacticItem[];
  riskScore: number;
  riskLevel: RiskLevel;
  riskTrend: 'rising' | 'falling' | 'stable';
  alertMessage: string;
  alertAction: string;
  aiConnected: boolean;
  analysisStatus: 'idle' | 'connecting' | 'ready' | 'degraded' | 'error';
  analysisMessage: string;
  audioPlaybackStatus: 'idle' | 'waiting' | 'playing' | 'blocked' | 'error';
  audioPlaybackMessage: string;
  turnConfigured: boolean;
  iceRoute: 'checking' | 'direct' | 'relay' | 'unknown';
  isSimulation: boolean;
  explanation: string;
}

export class WebRTCService {
  private ws: WebSocket | null = null;
  private aiWs: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private pendingOffer: any = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private ringTimer: any = null;
  private tickTimer: any = null;
  private animFrame: any = null;
  private audioStatsTimer: any = null;
  private pendingAnalysisTurns: Array<{ type: 'transcript'; id: string; text: string; lang: string; t0: number; t1: number }> = [];

  public state: WebRTCState = {
    myId: '1001',
    peerId: '',
    callState: 'idle',
    statusText: 'Ready',
    isMuted: false,
    durationSec: 0,
    audioBytesSent: 0,
    audioReceiveBytes: 0,
    localLevel: 0,
    remoteLevel: 0,
    transcripts: [],
    tactics: [],
    riskScore: 0,
    riskLevel: 'Low',
    riskTrend: 'stable',
    alertMessage: 'Monitoring caller for psychological fraud tactics…',
    alertAction: 'No immediate threat detected.',
    aiConnected: false,
    analysisStatus: 'idle',
    analysisMessage: 'AI analysis is not connected.',
    audioPlaybackStatus: 'idle',
    audioPlaybackMessage: 'Caller audio will play here.',
    turnConfigured: false,
    iceRoute: 'unknown',
    isSimulation: false,
    explanation: 'ScamChain conversational surveillance is active on this line.'
  };

  private listeners: ((state: WebRTCState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.remoteAudio = new Audio();
      this.remoteAudio.autoplay = true;
      this.remoteAudio.volume = 1;
      this.remoteAudio.muted = false;
      this.remoteAudio.setAttribute('playsinline', '');
      this.remoteAudio.setAttribute('webkit-playsinline', '');
      Object.assign(this.remoteAudio.style, {
        position: 'fixed', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none'
      });
      this.remoteAudio.addEventListener('playing', () => {
        this.state.audioPlaybackStatus = 'playing';
        this.state.audioPlaybackMessage = 'Caller audio is playing.';
        this.notify();
      });
    }
  }

  public subscribe(fn: (state: WebRTCState) => void) {
    this.listeners.push(fn);
    fn({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach(fn => fn(copy));
  }

  public setMyId(id: string) {
    this.state.myId = id;
    this.notify();
  }

  public register(id?: string) {
    const myId = id || this.state.myId;
    this.state.myId = myId;
    
    if (this.ws) {
      try { this.ws.close(); } catch(e) {}
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to Node signaling on port 3000 if running under Vite port 5173
    const host = window.location.port === '5173' ? `${window.location.hostname}:3000` : window.location.host;
    const wsUrl = `${proto}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.sendSignaling({ type: 'register', id: myId });
        this.state.statusText = `Registered as ${myId}`;
        this.notify();
      };

      this.ws.onmessage = async (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        if (msg.type === 'registered') {
          this.state.statusText = `Online (${myId})`;
          this.notify();
        } else if (msg.type === 'error') {
          this.state.statusText = msg.msg || 'Registration error';
          this.notify();
        } else if (msg.type === 'unavailable') {
          this.state.statusText = 'User is offline';
          this.endCall(false);
        } else if (msg.type === 'offer') {
          if (this.pc || this.pendingOffer) {
            this.sendSignaling({ type: 'reject', to: msg.from });
            return;
          }
          this.pendingOffer = msg;
          this.state.peerId = msg.from;
          this.state.callState = 'incoming';
          this.state.statusText = `Incoming call from ${msg.from}…`;
          this.notify();
        } else if (msg.type === 'answer') {
          clearTimeout(this.ringTimer);
          if (this.pc) {
            await this.pc.setRemoteDescription(msg.sdp);
            this.flushIce();
            this.state.statusText = 'Connecting media…';
            this.notify();
          }
        } else if (msg.type === 'ice') {
          if (this.pc && this.pc.remoteDescription) {
            try { this.pc.addIceCandidate(msg.candidate); } catch(err) {}
          } else {
            this.pendingIce.push(msg.candidate);
          }
        } else if (msg.type === 'reject') {
          this.state.statusText = 'Call declined';
          this.endCall(false);
        } else if (msg.type === 'hangup') {
          this.state.statusText = 'Call ended by remote peer';
          this.endCall(false);
        }
      };

      this.ws.onclose = () => {
        this.state.statusText = 'Signaling offline';
        this.notify();
      };
    } catch (err) {
      console.warn('Signaling connect error:', err);
    }
  }

  private sendSignaling(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private flushIce() {
    if (!this.pc) return;
    this.pendingIce.forEach(c => {
      try { this.pc?.addIceCandidate(c); } catch(e) {}
    });
    this.pendingIce = [];
  }

  private async loadIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await fetch('/api/ice', { cache: 'no-store' });
      if (!response.ok) throw new Error(`ICE config returned HTTP ${response.status}`);
      const config = await response.json() as { iceServers?: RTCIceServer[]; turnConfigured?: boolean };
      if (Array.isArray(config.iceServers) && config.iceServers.length > 0) {
        this.state.turnConfigured = config.turnConfigured ?? config.iceServers.some(server => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          return urls.some(url => typeof url === 'string' && /^(turn|turns):/i.test(url));
        });
        this.state.iceRoute = 'checking';
        this.notify();
        return config.iceServers;
      }
    } catch (error) {
      console.warn('Could not load ICE config; using STUN-only fallback:', error);
    }
    this.state.turnConfigured = false;
    this.state.iceRoute = 'checking';
    this.notify();
    return ICE_SERVERS;
  }

  private async makePC(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e) {
      this.state.statusText = 'Microphone permission denied';
      this.notify();
      return false;
    }

    this.pc = new RTCPeerConnection({ iceServers: await this.loadIceServers() });
    this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.state.peerId) {
        this.sendSignaling({ type: 'ice', to: this.state.peerId, candidate: e.candidate });
      }
    };

    this.pc.ontrack = (e) => {
      this.remoteStream = e.streams[0] || new MediaStream([e.track]);
      if (this.remoteAudio) {
        const audio = this.remoteAudio;
        if (!audio.isConnected) document.body.appendChild(audio);
        audio.srcObject = this.remoteStream;
        audio.play().then(() => {
          this.state.audioPlaybackStatus = 'playing';
          this.state.audioPlaybackMessage = 'Caller audio is playing.';
          this.notify();
        }).catch((error) => {
          console.warn('Mobile browser blocked call audio playback:', error);
          this.state.audioPlaybackStatus = 'blocked';
          this.state.audioPlaybackMessage = 'Tap Enable audio to hear the caller.';
          this.notify();
        });
      }
      this.state.audioPlaybackStatus = 'waiting';
      this.state.audioPlaybackMessage = 'Caller connected; starting audio…';
      this.notify();
      this.startAudioWorklet();
    };

    this.pc.oniceconnectionstatechange = () => {
      const iceState = this.pc?.iceConnectionState;
      if (iceState === 'failed') {
        this.state.iceRoute = 'unknown';
        this.state.statusText = 'Media route failed — TURN relay may be required';
        this.state.audioPlaybackStatus = 'error';
        this.state.audioPlaybackMessage = this.state.turnConfigured
          ? 'No media route. Check TURN credentials, network access, and retry.'
          : 'No media route. Configure Cloudflare TURN and retry.';
        this.notify();
      } else if (iceState === 'connected' || iceState === 'completed') {
        this.state.iceRoute = 'checking';
        void this.updateConnectionStats();
        clearInterval(this.audioStatsTimer);
        this.audioStatsTimer = setInterval(() => void this.updateConnectionStats(), 1500);
        if (this.state.audioPlaybackStatus !== 'playing') {
          this.state.audioPlaybackMessage = this.remoteStream
            ? 'Media route connected; waiting for caller audio.'
            : 'Media route connected; waiting for caller track.';
        }
        this.notify();
      }
    };

    this.pc.onconnectionstatechange = () => {
      const s = this.pc?.connectionState;
      if (s === 'connected') {
        this.onConnected();
      } else if (s === 'failed') {
        this.state.statusText = 'Connection failed';
        this.notify();
        setTimeout(() => {
          if (this.pc && this.pc.connectionState === 'failed') this.endCall(false);
        }, 4000);
      } else if (s === 'closed') {
        this.endCall(false);
      }
    };

    this.startAudioMeters();
    return true;
  }

  private async updateConnectionStats() {
    const pc = this.pc;
    if (!pc) return;
    try {
      const stats = await pc.getStats();
      let selectedPair: (RTCStats & {
        localCandidateId?: string;
        remoteCandidateId?: string;
      }) | undefined;
      stats.forEach(report => {
        const pair = report as RTCStats & {
          type: string;
          selected?: boolean;
          nominated?: boolean;
          state?: string;
          localCandidateId?: string;
          remoteCandidateId?: string;
        };
        if (pair.type === 'candidate-pair' && (pair.selected || (pair.nominated && pair.state === 'succeeded'))) {
          selectedPair = pair;
        }
      });
      if (!selectedPair) {
        this.state.iceRoute = 'unknown';
      } else {
        const pair = selectedPair;
        const local = pair.localCandidateId
          ? stats.get(pair.localCandidateId) as RTCStats & { candidateType?: string }
          : undefined;
        const remote = pair.remoteCandidateId
          ? stats.get(pair.remoteCandidateId) as RTCStats & { candidateType?: string }
          : undefined;
        this.state.iceRoute = local?.candidateType === 'relay' || remote?.candidateType === 'relay' ? 'relay' : 'direct';
      }

      let receivedBytes = 0;
      let audioLevel = 0;
      stats.forEach(report => {
        const inbound = report as RTCStats & {
          type: string;
          kind?: string;
          mediaType?: string;
          isRemote?: boolean;
          bytesReceived?: number;
          audioLevel?: number;
        };
        if (inbound.type === 'inbound-rtp' && inbound.isRemote !== true && (inbound.kind === 'audio' || inbound.mediaType === 'audio')) {
          receivedBytes += inbound.bytesReceived || 0;
          if (typeof inbound.audioLevel === 'number') audioLevel = Math.max(audioLevel, inbound.audioLevel);
        }
      });
      this.state.audioReceiveBytes = receivedBytes;
      this.state.remoteLevel = Math.min(100, Math.round(audioLevel * 100));
      if (receivedBytes > 0 && this.state.audioPlaybackStatus !== 'playing' && this.state.audioPlaybackStatus !== 'blocked') {
        this.state.audioPlaybackMessage = 'Audio packets are arriving; confirm phone volume and audio playback.';
      }
      this.notify();
    } catch (error) {
      console.debug('Could not read selected ICE route:', error);
      this.state.iceRoute = 'unknown';
    }
  }

  public async startCall(toId: string) {
    if (!toId || toId === this.state.myId) return;
    this.state.peerId = toId;
    this.state.callState = 'calling';
    this.state.statusText = `Calling ${toId}…`;
    this.state.isSimulation = false;
    this.resetAIState();
    this.connectAIWebSocket();
    this.notify();

    const ok = await this.makePC();
    if (!ok) {
      this.endCall(false);
      return;
    }

    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    this.sendSignaling({ type: 'offer', to: toId, sdp: this.pc!.localDescription });

    this.ringTimer = setTimeout(() => {
      this.state.statusText = 'No answer';
      this.endCall(true);
    }, 45000);
  }

  public async acceptCall() {
    if (!this.pendingOffer) return;
    this.state.callState = 'calling';
    this.state.statusText = 'Connecting call…';
    this.state.isSimulation = false;
    this.resetAIState();
    this.connectAIWebSocket();
    this.notify();

    const ok = await this.makePC();
    if (!ok) {
      this.endCall(true);
      return;
    }

    await this.pc!.setRemoteDescription(this.pendingOffer.sdp);
    this.flushIce();
    this.pendingOffer = null;

    const ans = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(ans);
    this.sendSignaling({ type: 'answer', to: this.state.peerId, sdp: this.pc!.localDescription });
  }

  public rejectCall() {
    if (this.pendingOffer) {
      this.sendSignaling({ type: 'reject', to: this.pendingOffer.from });
      this.pendingOffer = null;
    }
    this.state.callState = 'idle';
    this.state.statusText = 'Call declined';
    this.notify();
  }

  private onConnected() {
    this.state.callState = 'connected';
    this.state.statusText = 'Call Active';
    this.state.durationSec = 0;
    this.notify();

    clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => {
      this.state.durationSec += 1;
      this.notify();
    }, 1000);

  }

  public toggleMute() {
    if (!this.localStream) return;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      this.state.isMuted = !track.enabled;
      this.notify();
    }
  }

  public async enableAudioPlayback() {
    if (!this.remoteAudio || !this.remoteStream) {
      this.state.audioPlaybackStatus = 'waiting';
      this.state.audioPlaybackMessage = 'Waiting for the caller audio track…';
      this.notify();
      return;
    }
    try {
      await this.remoteAudio.play();
      this.state.audioPlaybackStatus = 'playing';
      this.state.audioPlaybackMessage = 'Caller audio is playing.';
    } catch (error) {
      console.warn('Could not start caller audio playback:', error);
      this.state.audioPlaybackStatus = 'blocked';
      this.state.audioPlaybackMessage = 'Audio is blocked by the browser. Check phone volume and tap again.';
    }
    this.notify();
  }

  public endCall(notifyRemote: boolean = true) {
    if (notifyRemote && this.state.peerId) {
      this.sendSignaling({ type: this.pendingOffer ? 'reject' : 'hangup', to: this.state.peerId });
    }

    clearTimeout(this.ringTimer);
    clearInterval(this.tickTimer);
    clearInterval(this.audioStatsTimer);
    cancelAnimationFrame(this.animFrame);

    this.stopAudioWorklet();

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => t.stop());
      this.remoteStream = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.pendingOffer = null;
    this.pendingIce = [];
    this.state.callState = 'idle';
    this.state.localLevel = 0;
    this.state.remoteLevel = 0;
    this.state.audioReceiveBytes = 0;
    this.state.aiConnected = false;
    this.state.analysisStatus = 'idle';
    this.state.analysisMessage = 'AI analysis is disconnected.';
    this.state.audioPlaybackStatus = 'idle';
    this.state.audioPlaybackMessage = 'Caller audio will play here.';
    this.state.iceRoute = 'unknown';
    this.notify();
  }

  private resetAIState() {
    this.state.transcripts = [];
    this.state.tactics = [];
    this.state.riskScore = 0;
    this.state.riskLevel = 'Low';
    this.state.riskTrend = 'stable';
    this.state.audioBytesSent = 0;
    this.state.audioReceiveBytes = 0;
    this.state.audioPlaybackStatus = 'waiting';
    this.state.audioPlaybackMessage = 'Waiting for caller audio…';
    this.state.aiConnected = false;
    this.state.analysisStatus = 'idle';
    this.state.analysisMessage = 'Waiting for the AI analysis service…';
    this.state.alertMessage = 'Monitoring caller for psychological fraud tactics…';
    this.state.alertAction = 'No immediate action needed.';
    this.state.explanation = 'ScamChain conversational surveillance is active on this line.';
  }

  /* ===== AI WEBSOCKET CONNECTION ===== */
  private connectAIWebSocket() {
    // Give each endpoint its own analysis session; sorting IDs made both ends
    // overwrite and reset the same backend conversation and risk state.
    const callId = `${this.state.myId}-${this.state.peerId}`;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? `${window.location.hostname}:3000` : window.location.host;
    const wsUrl = `${proto}//${host}/ws/analyze/${encodeURIComponent(callId)}`;
    this.state.analysisStatus = 'connecting';
    this.state.analysisMessage = 'Connecting to live AI analysis…';
    this.pendingAnalysisTurns = [];
    this.notify();

    if (this.aiWs) {
      try { this.aiWs.close(); } catch(e) {}
    }

    try {
      const aiSocket = new WebSocket(wsUrl);
      this.aiWs = aiSocket;
      aiSocket.binaryType = 'arraybuffer';

      aiSocket.onopen = () => {
        if (this.aiWs !== aiSocket) return;
        this.state.aiConnected = true;
        this.state.analysisStatus = 'connecting';
        this.state.analysisMessage = 'AI socket connected; starting analysis…';
        this.notify();
        aiSocket.send(JSON.stringify({ type: 'start', call_id: callId, sample_rate: 16000 }));
        while (this.pendingAnalysisTurns.length > 0) {
          aiSocket.send(JSON.stringify(this.pendingAnalysisTurns.shift()));
        }
      };

      aiSocket.onmessage = (e) => {
        if (this.aiWs !== aiSocket) return;
        try {
          const data = JSON.parse(e.data);
          this.handleAIMessage(data);
        } catch (err) {}
      };

      aiSocket.onclose = () => {
        if (this.aiWs !== aiSocket) return;
        this.state.aiConnected = false;
        if (this.state.callState !== 'idle') {
          this.state.analysisStatus = 'error';
          this.state.analysisMessage = 'AI analysis disconnected; live risk scoring is paused.';
        }
        this.notify();
      };

      aiSocket.onerror = () => {
        if (this.aiWs !== aiSocket) return;
        this.state.analysisStatus = 'error';
        this.state.analysisMessage = 'Could not reach the AI service; live risk scoring is unavailable.';
        this.notify();
      };
    } catch (err) {
      console.warn('AI WS connect error:', err);
    }
  }

  private handleAIMessage(data: any) {
    if (data.type === 'status') {
      if (data.audio_bytes !== undefined) {
        this.state.audioBytesSent = data.audio_bytes;
      }
      if (data.state === 'error') this.state.analysisStatus = 'error';
      else if (data.state === 'degraded') this.state.analysisStatus = 'degraded';
      else if (data.state === 'listening') this.state.analysisStatus = 'ready';
      if (data.message || data.warning) {
        this.state.analysisMessage = data.message || data.warning;
      } else if (data.llm_provider) {
        this.state.analysisMessage = `Live analysis ready · ${data.llm_provider} classifier with local risk engine`;
      }
    } else if (data.type === 'transcript') {
      const id = data.id || String(Date.now());
      const existingIndex = this.state.transcripts.findIndex(turn => turn.id === id);
      const prior = existingIndex >= 0 ? this.state.transcripts[existingIndex] : undefined;
      const turn: TranscriptTurn = {
        id,
        speaker: 'Caller',
        lang: data.lang || 'auto',
        text: data.text,
        t0: data.t0 || 0,
        t1: data.t1,
        tactics: prior?.tactics || []
      };
      if (existingIndex >= 0) this.state.transcripts[existingIndex] = turn;
      else this.state.transcripts.push(turn);
    } else if (data.type === 'tactics') {
      const items = data.items || [];
      const turnId = data.turn_id;
      this.state.tactics = turnId
        ? [...this.state.tactics.filter(item => item.turn_id !== turnId), ...items]
        : items;
      if (turnId) {
        const transcript = this.state.transcripts.find(turn => turn.id === turnId);
        if (transcript) transcript.tactics = items;
      }
    } else if (data.type === 'risk') {
      const wasCritical = this.state.riskLevel === 'Critical';
      this.state.riskScore = Math.round(data.score || 0);
      this.state.riskLevel = data.level || 'Low';
      this.state.riskTrend = data.trend || 'stable';
      if (!wasCritical && this.state.riskLevel === 'Critical') {
        this.playAlertTone();
      }
    } else if (data.type === 'alert') {
      this.state.alertMessage = data.message || '';
      this.state.alertAction = data.action || '';
    }
    this.notify();
  }

  private sendAnalysisTurn(turn: { type: 'transcript'; id: string; text: string; lang: string; t0: number; t1: number }) {
    if (this.aiWs?.readyState === WebSocket.OPEN) {
      this.aiWs.send(JSON.stringify(turn));
    } else {
      this.pendingAnalysisTurns.push(turn);
    }
  }

  private async startAudioWorklet() {
    try {
      this.audioCtx = this.audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      await this.audioCtx.audioWorklet.addModule('/pcm-worklet.js');

      if (!this.workletNode) {
        this.workletNode = new AudioWorkletNode(this.audioCtx, 'pcm-worklet-processor');
        this.workletNode.port.onmessage = (e) => {
          if (this.aiWs && this.aiWs.readyState === WebSocket.OPEN) {
            this.aiWs.send(e.data);
          }
        };

        const silentGain = this.audioCtx.createGain();
        silentGain.gain.value = 0.0;
        this.workletNode.connect(silentGain);
        silentGain.connect(this.audioCtx.destination);
      }

      if (this.remoteStream) {
        const remoteSrc = this.audioCtx.createMediaStreamSource(this.remoteStream);
        remoteSrc.connect(this.workletNode);
      }
    } catch (err) {
      console.warn('AudioWorklet setup error:', err);
    }
  }

  private stopAudioWorklet() {
    this.pendingAnalysisTurns = [];
    if (this.aiWs) {
      try {
        if (this.aiWs.readyState === WebSocket.OPEN) {
          this.aiWs.send(JSON.stringify({ type: 'stop' }));
        }
        this.aiWs.close();
      } catch(e) {}
      this.aiWs = null;
    }
    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch(e) {}
      this.workletNode = null;
    }
  }

  private startAudioMeters() {
    if (!this.localStream) return;
    try {
      this.audioCtx = this.audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      const localSrc = this.audioCtx.createMediaStreamSource(this.localStream);
      const anLocal = this.audioCtx.createAnalyser();
      anLocal.fftSize = 256;
      localSrc.connect(anLocal);

      const bufLocal = new Uint8Array(anLocal.frequencyBinCount);

      const loop = () => {
        if (this.state.callState === 'idle') return;
        anLocal.getByteTimeDomainData(bufLocal);
        let maxL = 0;
        for (let i = 0; i < bufLocal.length; i++) {
          maxL = Math.max(maxL, Math.abs(bufLocal[i] - 128));
        }
        this.state.localLevel = Math.min(100, Math.round(maxL * 1.8));

        // If in simulation, generate synthetic waveform pulses
        if (this.state.isSimulation) {
          this.state.remoteLevel = Math.min(100, Math.floor(Math.random() * 60 + 20));
        }

        this.notify();
        this.animFrame = requestAnimationFrame(loop);
      };
      loop();
    } catch(e) {}
  }

  private playAlertTone() {
    try {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
      if (navigator.vibrate) {
        navigator.vibrate([250, 100, 250]);
      }
    } catch(e) {}
  }

  /* ===== INTERACTIVE DEMO SIMULATION ENGINE ===== */
  private simTimeouts: any[] = [];

  public startSimulation(scriptKey: 'digitalArrest' | 'otpScam' | 'benignCall') {
    this.endCall(false);
    this.clearSimulation();

    const scriptItems = scriptKey === 'digitalArrest'
      ? [
          { delay: 1000, lang: 'en', text: 'Hello, this is Senior Inspector Rajesh Verma calling from CBI Cyber Crime Branch, New Delhi.' },
          { delay: 4500, lang: 'hi', text: 'Aapke Aadhaar number se ek illegal courier parcel intercept hua hai jisme narcotics aur 150 gram cocaine mili hai.' },
          { delay: 8500, lang: 'en', text: 'Supreme Court has issued a non-bailable arrest warrant. You are placed under immediate Digital Arrest. Do not disconnect.' },
          { delay: 13000, lang: 'hi', text: 'Apne room ka door lock karo, video call chalu rakho aur kisi family member ya lawyer ko mat batana.' },
          { delay: 17500, lang: 'en', text: 'Transfer your entire savings to the RBI security verification account right now or read back your bank OTP for clearance.' }
        ]
      : scriptKey === 'otpScam'
        ? [
            { delay: 1000, lang: 'en', text: 'Good morning sir, calling from HDFC Bank Fraud Prevention Unit.' },
            { delay: 4500, lang: 'en', text: 'An unauthorized international charge of Rs 89,450 is pending on your debit card.' },
            { delay: 8500, lang: 'en', text: 'We have triggered a cancellation OTP. Read back the 6-digit code to cancel the charge.' }
          ]
        : [
            { delay: 1000, lang: 'en', text: 'Hi Shivam, this is Ajay from the society management committee.' },
            { delay: 4000, lang: 'en', text: 'Just calling to confirm the annual maintenance meeting this Saturday at 10 AM.' }
          ];

    this.resetAIState();
    this.state.peerId = (scriptKey === 'digitalArrest') ? '+91 98201 44821' : (scriptKey === 'otpScam') ? '+91 84210 99120' : '+91 22 2840 9180';
    this.state.callState = 'connected';
    this.state.isSimulation = true;
    this.state.statusText = `Simulating: ${scriptKey === 'digitalArrest' ? 'Digital Arrest Scam' : scriptKey === 'otpScam' ? 'OTP Phishing Scam' : 'Benign Call'}`;
    this.notify();
    this.connectAIWebSocket();

    // Start timer
    clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => {
      this.state.durationSec += 1;
      this.notify();
    }, 1000);

    // Schedule progressive speech events
    scriptItems.forEach((item, idx) => {
      const tid = setTimeout(() => {
        const turnTime = item.delay / 1000;
        this.sendAnalysisTurn({
          type: 'transcript',
          id: `sim-${scriptKey}-${idx}`,
          text: item.text,
          lang: item.lang,
          t0: turnTime,
          t1: turnTime + 1,
        });
        this.notify();
      }, item.delay);
      this.simTimeouts.push(tid);
    });
  }

  public clearSimulation() {
    this.simTimeouts.forEach(t => clearTimeout(t));
    this.simTimeouts = [];
  }
}

export const webrtcService = new WebRTCService();

