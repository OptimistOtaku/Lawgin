import React from 'react';
import { AccessibilitySettings, PersonaType } from '../types/legal';
import { ShieldCheck, Scale, Sparkles, Key, Eye, EyeOff, Type, Contrast, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentPersona: PersonaType;
  onSelectPersona: (p: PersonaType) => void;
  accessibility: AccessibilitySettings;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  piiRedactedCount: number;
  showPIIMaskedView: boolean;
  onTogglePIIView: () => void;
  isSpeaking: boolean;
  onStopTTS: () => void;
  onOpenApiKeyModal: () => void;
  activeModel: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersona,
  onSelectPersona,
  accessibility,
  onUpdateAccessibility,
  isDarkMode,
  onToggleTheme,
  piiRedactedCount,
  showPIIMaskedView,
  onTogglePIIView,
  isSpeaking,
  onStopTTS,
  onOpenApiKeyModal,
  activeModel
}) => {
  const personas: { id: PersonaType; label: string; desc: string }[] = [
    { id: 'layman', label: 'Plain English', desc: 'Everyday conversational terms' },
    { id: 'tenant', label: 'Tenant', desc: 'Lease & housing protections' },
    { id: 'freelancer', label: 'Freelancer', desc: 'IP, invoices & scope' },
    { id: 'consumer', label: 'Consumer', desc: 'Terms of service & subscriptions' },
    { id: 'business', label: 'Small Business', desc: 'Commercial liability & risk' }
  ];

  return (
    <header className="relative z-40 w-full glass-panel px-4 py-3 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-700 via-cyan-600 to-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-900/40 ring-2 ring-cyan-500/25 animate-glow">
              <Scale className="w-5 h-5 text-on-gold" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-bold tracking-[0.08em] text-gilded leading-none">
                  LAW GIN
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Lex &amp; AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-reading italic tracking-wide">Wisdom of the law, in plain speech</p>
            </div>
          </div>

          {/* Quick Model / API Key Trigger */}
          <button
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
            title="Configure Gemini API Key & Model"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{activeModel}</span>
            <Key className="w-3 h-3 text-cyan-400 ml-0.5" />
          </button>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Lens:
          </span>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                currentPersona === p.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Accessibility & Privacy Shield Toolbar */}
        <div className="flex items-center gap-2">
          {/* Audio TTS Indicator */}
          {isSpeaking && (
            <button
              onClick={onStopTTS}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs animate-pulse"
              title="Click to Stop Narration"
            >
              <div className="flex items-center gap-0.5 h-3">
                <span className="tts-bar" />
                <span className="tts-bar" />
                <span className="tts-bar" />
              </div>
              <span className="text-[11px] font-medium">Speaking</span>
            </button>
          )}

          {/* PII Shield Status */}
          <button
            onClick={onTogglePIIView}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showPIIMaskedView
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Client-Side PII Masking Shield Preview"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">PII Shield:</span>
            <span className="font-mono text-[11px]">{piiRedactedCount} masked</span>
            {showPIIMaskedView ? <EyeOff className="w-3 h-3 ml-0.5 text-emerald-400" /> : <Eye className="w-3 h-3 ml-0.5 text-slate-400" />}
          </button>

          {/* Dyslexia Font Toggle */}
          <button
            onClick={() => onUpdateAccessibility({ dyslexiaFont: !accessibility.dyslexiaFont })}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              accessibility.dyslexiaFont
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Dyslexia-Friendly Typography"
            aria-label="Toggle Dyslexia Font"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Font Zoom Cycler */}
          <button
            onClick={() => {
              const next = accessibility.fontSize === 'normal' ? 'large' : accessibility.fontSize === 'large' ? 'xlarge' : 'normal';
              onUpdateAccessibility({ fontSize: next });
            }}
            className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
            title="Adjust Text Size"
          >
            {accessibility.fontSize === 'normal' ? 'A' : accessibility.fontSize === 'large' ? 'A+' : 'A++'}
          </button>

          {/* High Contrast Mode */}
          <button
            onClick={() => onUpdateAccessibility({ highContrast: !accessibility.highContrast })}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              accessibility.highContrast
                ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle High-Contrast Mode (WCAG AAA)"
            aria-label="High Contrast Mode"
          >
            <Contrast className="w-3.5 h-3.5" />
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
        </div>

      </div>
      <div className="meander-rule mt-2 max-w-7xl mx-auto" />
    </header>
  );
};
