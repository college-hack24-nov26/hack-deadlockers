import React from 'react';
import { useScamChain } from './hooks/useScamChain';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/views/OverviewView';
import { LiveCallView } from './components/views/LiveCallView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { CallInspectModal } from './components/common/CallInspectModal';
import { PhoneIncoming, Check, X, ShieldAlert } from 'lucide-react';

export function App() {
  const {
    activeTab,
    setActiveTab,
    callState,
    dialNumber,
    setDialNumber,
    inspectCall,
    setInspectCall,
    toastMessage,
    triggerToast,
    handleStartCall,
    handleEndCall,
    handleSimulate,
    handleRegisterId,
    acceptCall,
    rejectCall,
    toggleMute,
    enableAudioPlayback,
    historicCalls
  } = useScamChain();

  const isCallActive = callState.callState === 'connected' || callState.callState === 'calling';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-[#0071E3] selection:text-white">
      {/* Apple Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCallActive={isCallActive}
        riskLevel={callState.riskLevel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Apple Top Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dialNumber={dialNumber}
          setDialNumber={setDialNumber}
          onStartCall={handleStartCall}
          onSimulate={handleSimulate}
          isCallActive={isCallActive}
          myId={callState.myId}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'overview' && (
            <OverviewView
              onSelectTab={setActiveTab}
              callState={callState}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onSimulate={handleSimulate}
              onInspectCall={setInspectCall}
              historicCalls={historicCalls}
              dialNumber={dialNumber}
              setDialNumber={setDialNumber}
            />
          )}

          {activeTab === 'live-call' && (
            <LiveCallView
              callState={callState}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMute={toggleMute}
              onEnableAudio={enableAudioPlayback}
              onSimulate={handleSimulate}
              dialNumber={dialNumber}
              setDialNumber={setDialNumber}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              calls={historicCalls}
              onInspectCall={setInspectCall}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              myId={callState.myId}
              isCallActive={isCallActive}
              onRegister={handleRegisterId}
              triggerToast={triggerToast}
            />
          )}
        </main>
      </div>

      {/* Incoming Call Overlay Modal (Apple Style) */}
      {callState.callState === 'incoming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xl text-center space-y-4">
            <div className="relative mx-auto w-16 h-16 rounded-full bg-blue-50 text-[#0071E3] flex items-center justify-center shadow-md shadow-blue-500/10">
              <PhoneIncoming className="w-8 h-8 animate-bounce" />
              <span className="absolute inset-0 rounded-full border-2 border-[#0071E3] animate-ping pointer-events-none opacity-40" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold text-[#0071E3] tracking-wider">
                Incoming WebRTC Call
              </span>
              <h3 className="text-xl font-extrabold text-[#1D1D1F] mt-1 font-mono">
                Peer {callState.peerId}
              </h3>
              <p className="text-xs text-[#86868B] mt-1">
                ScamChain conversational shield active on pickup.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={rejectCall}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-[#FF3B30] text-xs font-semibold transition-all border border-red-200/60"
              >
                <X className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" /> Accept Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Inspection Modal */}
      <CallInspectModal
        call={inspectCall}
        onClose={() => setInspectCall(null)}
      />

      {/* Global Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200/80 text-[#1D1D1F] text-xs font-medium shadow-xl animate-in slide-in-from-bottom-4 duration-200">
          <ShieldAlert className="w-4 h-4 text-[#0071E3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
