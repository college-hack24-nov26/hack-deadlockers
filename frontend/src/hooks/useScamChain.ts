import { useState, useEffect } from 'react';
import { webrtcService, WebRTCState } from '../services/webrtc';
import { NavTab, CallRecord } from '../types';
import { HISTORIC_CALLS } from '../services/mockData';

export function useScamChain() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [callState, setCallState] = useState<WebRTCState>(webrtcService.state);
  const [dialNumber, setDialNumber] = useState('1002');
  const [inspectCall, setInspectCall] = useState<CallRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Let each phone choose a distinct signaling identity via settings or ?id=1002.
    const requestedId = new URLSearchParams(window.location.search).get('id')?.trim()
      || window.localStorage.getItem('scamchain.lineId')?.trim();
    const endpointId = requestedId && /^[\w-]{1,32}$/.test(requestedId) ? requestedId : undefined;
    webrtcService.register(endpointId);
    const unsub = webrtcService.subscribe(setCallState);
    return unsub;
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartCall = (targetNum?: string) => {
    const num = targetNum || dialNumber;
    if (!num) return;
    webrtcService.startCall(num);
    setActiveTab('live-call');
  };

  const handleEndCall = () => {
    webrtcService.endCall(true);
    triggerToast('Call terminated. Forensic record saved.');
  };

  const handleSimulate = (key: 'digitalArrest' | 'otpScam' | 'benignCall') => {
    webrtcService.startSimulation(key);
    setActiveTab('live-call');
    triggerToast(`Simulation started: ${key}`);
  };

  const handleRegisterId = (id: string) => {
    const normalizedId = id.trim();
    if (!/^[\w-]{1,32}$/.test(normalizedId)) {
      triggerToast('Use 1–32 letters, numbers, underscores, or hyphens for your line ID.');
      return false;
    }
    if (callState.callState !== 'idle') {
      triggerToast('End the active call before changing your line ID.');
      return false;
    }
    window.localStorage.setItem('scamchain.lineId', normalizedId);
    webrtcService.register(normalizedId);
    return true;
  };

  return {
    activeTab,
    setActiveTab,
    callState,
    dialNumber,
    setDialNumber,
    inspectCall,
    setInspectCall,
    searchQuery,
    setSearchQuery,
    toastMessage,
    triggerToast,
    handleStartCall,
    handleEndCall,
    handleSimulate,
    handleRegisterId,
    acceptCall: () => {
      webrtcService.acceptCall();
      setActiveTab('live-call');
    },
    rejectCall: () => webrtcService.rejectCall(),
    toggleMute: () => webrtcService.toggleMute(),
    enableAudioPlayback: () => webrtcService.enableAudioPlayback(),
    enableAnalysisAudio: () => webrtcService.enableAnalysisAudio(),
    historicCalls: HISTORIC_CALLS
  };
}

