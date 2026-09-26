import React, { useState } from 'react';
import { Clause, DocumentAnalysis, PersonaType } from '../../types/legal';
import { Sparkles, Volume2, VolumeX, ShieldCheck, ShieldAlert, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface DocumentSimplifierProps {
  analysis: DocumentAnalysis;
  currentPersona: PersonaType;
  isSpeaking: boolean;
  onToggleTTS: (text: string) => void;
  activeSpeakingText: string;
}

export const DocumentSimplifier: React.FC<DocumentSimplifierProps> = ({
  analysis,
  currentPersona,
  isSpeaking,
  onToggleTTS,
  activeSpeakingText
}) => {
  const [expandedClauseIds, setExpandedClauseIds] = useState<Record<string, boolean>>({});
  const [viewModes, setViewModes] = useState<Record<string, 'plain' | 'original'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedClauseIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleViewMode = (id: string) => {
    setViewModes(prev => ({
      ...prev,
      [id]: prev[id] === 'original' ? 'plain' : 'original'
    }));
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="glass-panel p-5 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Executive Plain-English Summary</h3>
              <p className="text-xs text-slate-400">Tailored through the <strong className="text-cyan-300 capitalize">{currentPersona}</strong> lens</p>
            </div>
          </div>

          <button
            onClick={() => onToggleTTS(analysis.plainEnglishSummary || analysis.executiveSummary)}
            className="btn-secondary text-xs"
            title="Read summary aloud"
          >
            {isSpeaking && activeSpeakingText === (analysis.plainEnglishSummary || analysis.executiveSummary) ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-cyan-400" /> Stop Listening
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Listen to TL;DR
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {analysis.plainEnglishSummary || analysis.executiveSummary}
        </p>

        {/* Obligations vs Rights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Your Key Obligations & Restrictions
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analysis.keyObligations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Your Rights & Defenses
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analysis.keyRights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Clause-by-Clause Simplified Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Clause-by-Clause Simplification ({analysis.clauses.length} Clauses)
          </h3>
          <span className="text-xs text-slate-400">Click any clause to toggle original legal text</span>
        </div>

        {analysis.clauses.map((clause: Clause) => {
          const isExpanded = expandedClauseIds[clause.id] !== false; // default open
          const mode = viewModes[clause.id] || 'plain';
          const isTTSActive = isSpeaking && activeSpeakingText.includes(clause.simplifiedText || clause.originalText);

          return (
            <div
              key={clause.id}
              id={clause.id}
              className={`glass-panel border transition-all ${
                clause.riskLevel === 'critical'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : clause.riskLevel === 'high'
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-white/10'
              }`}
            >
              {/* Clause Header Bar */}
              <div
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer select-none"
                onClick={() => toggleExpand(clause.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    § {clause.number}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{clause.title}</h4>
                  {clause.isPredatory && (
                    <span className="badge badge-critical text-[10px]">
                      Sneaky Trap
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Risk Badge */}
                  <span className={`badge ${
                    clause.riskLevel === 'critical'
                      ? 'badge-critical'
                      : clause.riskLevel === 'high'
                      ? 'badge-high'
                      : clause.riskLevel === 'medium'
                      ? 'badge-medium'
                      : 'badge-low'
                  }`}>
                    {clause.riskLevel} risk
                  </span>

                  {/* Audio Narrator */}
                  <button
                    onClick={() => onToggleTTS(clause.simplifiedText || clause.originalText)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      isTTSActive
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title="Read clause aloud"
                    aria-label={`Read clause ${clause.number} aloud`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Mode switch */}
                  <button
                    onClick={() => toggleViewMode(clause.id)}
                    className="px-2 py-1 rounded border border-slate-700 bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white"
                  >
                    {mode === 'plain' ? 'Show Legalese' : 'Show Plain English'}
                  </button>

                  <button
                    onClick={() => toggleExpand(clause.id)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clause Body */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5 text-xs">
                  {mode === 'plain' ? (
                    <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-slate-200 leading-relaxed">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Plain English Meaning
                      </div>
                      <p className="text-sm font-reading text-slate-100">
                        {clause.simplifiedText || clause.originalText}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-slate-300 leading-relaxed select-text">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Verbatim Contract Text
                      </div>
                      <p>{clause.originalText}</p>
                    </div>
                  )}

                  {/* Risk Explanation & Safer Alternative */}
                  {clause.riskExplanation && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="text-slate-300">
                        <strong className="text-amber-400 font-semibold">Legal Impact: </strong>
                        <span>{clause.riskExplanation}</span>
                      </div>

                      {clause.suggestedAlternative && (
                        <div className="pt-2 border-t border-slate-800 text-slate-300">
                          <strong className="text-emerald-400 font-semibold">Safer Counter-Proposal: </strong>
                          <span className="font-mono text-[11px] text-emerald-200/90 bg-emerald-950/30 px-2 py-0.5 rounded">
                            {clause.suggestedAlternative}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Category: <strong className="text-slate-400 uppercase">{clause.category}</strong></span>
                    <button
                      onClick={() => copyText(clause.id, clause.simplifiedText || clause.originalText)}
                      className="flex items-center gap-1 hover:text-slate-300"
                    >
                      {copiedId === clause.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === clause.id ? 'Copied' : 'Copy Summary'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
