import React, { useEffect, useRef, useState } from 'react';
import { GeminiService, DEFAULT_MODEL } from '../services/geminiService';
import { Key, CheckCircle2, AlertTriangle, X, RefreshCw, Sparkles, ShieldCheck, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (model: string) => void;
}

/** Models verified to serve structured JSON on the free tier. */
const MODEL_OPTIONS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', badge: 'Recommended · Fast & Free' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Stable' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Stable' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Lightest / Fastest' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Newest · tighter free quota' }
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const envConfigured =
    typeof import.meta.env?.VITE_GEMINI_API_KEY === 'string' &&
    import.meta.env.VITE_GEMINI_API_KEY.trim().length > 0;

  // Only the user-supplied key is shown here; the environment key stays out of the DOM.
  const [apiKey, setApiKey] = useState(
    typeof localStorage !== 'undefined' ? localStorage.getItem('lawgin_gemini_api_key') || '' : ''
  );
  const [model, setModel] = useState(GeminiService.getActiveModel());
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape and move focus into the dialog when it opens.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus({ loading: true });
    const res = await GeminiService.testConnection(apiKey.trim() || undefined, model);
    setTestStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) GeminiService.setKey(trimmed);
    else GeminiService.clearKey(); // fall back to the environment key
    GeminiService.setActiveModel(model);
    onConfigSaved(model);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Gemini AI configuration"
    >
      <div ref={dialogRef} className="glass-panel w-full max-w-md p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-full bg-gradient-to-tr from-indigo-700 to-cyan-500 text-on-gold shadow-md">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-gilded">Gemini AI Engine</h3>
            <p className="text-xs text-slate-400">Configure API access &amp; model selection</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={envConfigured ? 'Using key from environment (.env)' : 'AIza… or AQ.…'}
              autoComplete="off"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1.5">
              {envConfigured ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    A key is configured through the environment (.env / Vercel env vars). Leave this blank to keep
                    using it — your key is <strong className="text-slate-300">never</strong> exposed in the page.
                  </span>
                </>
              ) : (
                <span>The key is stored only in your browser and sent solely to Google's official API.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Active Gemini Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODEL_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  aria-pressed={model === m.id}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    model === m.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{m.name}</div>
                  <div className="text-[10px] text-cyan-400/90">{m.badge}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Default: <span className="font-mono text-slate-400">{DEFAULT_MODEL}</span>. If a model is rate-limited,
              Lawgin automatically retries the next free model.
            </p>
          </div>

          {testStatus.message && (
            <div
              role="status"
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testStatus.success
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleTest} disabled={testStatus.loading} className="btn-secondary text-xs">
                {testStatus.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Ping Test
                  </>
                )}
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKey('');
                    GeminiService.clearKey();
                  }}
                  className="btn-secondary text-xs"
                  title="Discard the stored browser key"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear
                </button>
              )}
            </div>

            <button type="button" onClick={handleSave} className="btn-primary text-xs">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
