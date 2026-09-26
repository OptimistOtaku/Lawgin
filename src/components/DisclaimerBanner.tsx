import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 px-4 py-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Lawgin provides legal intelligence & document navigation, not formal legal representation.</span>
        </span>
        <button
          onClick={() => setMinimized(false)}
          className="text-cyan-400 hover:underline"
        >
          Expand Notice
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Legal Disclaimer" className="bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-amber-950/40 border-b border-amber-500/20 px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="leading-snug">
            <strong className="text-amber-300 font-semibold mr-1.5">Ethical AI Notice (Non-UPL):</strong>
            Lawgin is an AI-powered legal reading, comparison, and preparation copilot. It provides automated document analysis and plain-language summaries for educational and informational purposes. It does not provide legal advice or establish an attorney-client relationship. Please consult a licensed attorney for binding legal matters.
          </p>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 shrink-0"
          title="Minimize Disclaimer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
