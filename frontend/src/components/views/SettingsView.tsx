import React, { useEffect, useState } from 'react';
import { Save, Smartphone } from 'lucide-react';

interface SettingsViewProps {
  myId: string;
  isCallActive: boolean;
  onRegister: (id: string) => boolean;
  triggerToast: (message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ myId, isCallActive, onRegister, triggerToast }) => {
  const [lineId, setLineId] = useState(myId);

  useEffect(() => setLineId(myId), [myId]);

  const saveLineId = (event: React.FormEvent) => {
    event.preventDefault();
    if (onRegister(lineId)) triggerToast(`Line ID set to ${lineId.trim()}. Share it with callers.`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 text-[#0071E3]">
            <Smartphone className="w-5 h-5" />
            <h1 className="text-xl font-bold text-[#1D1D1F]">Your call line</h1>
          </div>
          <p className="text-sm text-[#6E6E73] mt-2">
            Choose the ID friends should dial to reach you. Each browser/device needs a unique line ID.
          </p>
        </div>

        <form onSubmit={saveLineId} className="space-y-3">
          <label htmlFor="line-id" className="block text-xs font-semibold text-[#6E6E73]">Line ID</label>
          <input
            id="line-id"
            value={lineId}
            onChange={event => setLineId(event.target.value)}
            disabled={isCallActive}
            maxLength={32}
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-slate-200 text-[#1D1D1F] font-mono text-base focus:outline-none focus:border-[#0071E3] disabled:opacity-50"
            placeholder="e.g. 1002"
          />
          <p className="text-[11px] text-[#86868B]">Use 1–32 letters, numbers, underscores, or hyphens.</p>
          <button
            type="submit"
            disabled={isCallActive || !lineId.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Register this line
          </button>
          {isCallActive && <p className="text-xs text-amber-700">End the active call before changing your line ID.</p>}
        </form>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-[#1D1D1F]">How a friend calls you</p>
          <p>Share your line ID. They enter it in the app’s target field and tap Start Call; accept the incoming call here.</p>
        </div>
      </section>
    </div>
  );
};
