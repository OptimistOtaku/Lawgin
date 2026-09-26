import React, { useMemo, useState } from 'react';
import { DocumentAnalysis, PersonaType } from '../../types/legal';
import { SAMPLE_CONTRACTS, SampleContract } from '../../data/sampleContracts';
import { PIIShieldService, RedactionResult } from '../../services/piiRedactor';
import { FileText, ShieldAlert, Sparkles, Upload, CheckCircle2, Clock, BookOpen } from 'lucide-react';

interface DocumentStudioProps {
  currentContract: SampleContract;
  onSelectContract: (contract: SampleContract) => void;
  customText: string;
  onChangeCustomText: (text: string) => void;
  documentTitle: string;
  onChangeDocumentTitle: (title: string) => void;
  analysis: DocumentAnalysis | null;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
  currentPersona: PersonaType;
  showPIIMaskedView: boolean;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  currentContract,
  onSelectContract,
  customText,
  onChangeCustomText,
  documentTitle,
  onChangeDocumentTitle,
  analysis,
  isAnalyzing,
  onTriggerAnalysis,
  currentPersona,
  showPIIMaskedView
}) => {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'custom'>('benchmarks');
  const [dragOver, setDragOver] = useState(false);

  const rawText = activeTab === 'benchmarks' ? currentContract.text : customText;
  // Redaction is a multi-regex sweep; memoize so typing doesn't re-scan the document.
  const redactionInfo: RedactionResult = useMemo(() => PIIShieldService.redact(rawText), [rawText]);
  const displayedText = showPIIMaskedView ? redactionInfo.sanitizedText : rawText;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChangeCustomText(content);
        onChangeDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
        setActiveTab('custom');
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChangeCustomText(content);
        onChangeDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
        setActiveTab('custom');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Benchmark Switcher & Upload */}
      <div className="glass-panel p-4 sm:p-5 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Legal Document Workspace</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select a benchmark legal contract with real hidden traps, or upload your own agreement.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'benchmarks'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Benchmark Contracts (4)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Upload / Paste Custom
            </button>
          </div>
        </div>

        {/* Benchmark contract cards */}
        {activeTab === 'benchmarks' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {SAMPLE_CONTRACTS.map((contract) => {
              const isSelected = currentContract.id === contract.id;
              return (
                <div
                  key={contract.id}
                  onClick={() => onSelectContract(contract)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-900/20 ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                      {contract.type.replace('_', ' ')}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{contract.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{contract.description}</p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Counterparty: {contract.counterpartName}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => onChangeDocumentTitle(e.target.value)}
                placeholder="Document Title (e.g. Commercial Lease or Employment Offer)"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <label className="btn-secondary text-xs cursor-pointer justify-center">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Choose .txt, .md or .log</span>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.text,.log,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-4 transition-all ${
                dragOver ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <textarea
                value={customText}
                onChange={(e) => onChangeCustomText(e.target.value)}
                placeholder="Paste legal contract or policy text here to analyze..."
                rows={6}
                className="w-full bg-transparent resize-y text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Tip: Drag and drop any text/legal file directly into this box.</span>
                <span>{customText.length} characters</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Shield & Analysis Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score summary */}
        <div className="glass-panel p-4 border border-white/10 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
            analysis
              ? analysis.overallRiskScore > 70
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : analysis.overallRiskScore > 40
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {analysis ? `${analysis.overallRiskScore}` : '--'}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Overall Risk Score</div>
            <div className="text-sm font-bold text-slate-200">
              {analysis ? analysis.overallRiskVerdict : 'Ready to evaluate'}
            </div>
            {analysis && (
              <div className="text-[10px] text-slate-400">
                {analysis.predatoryTrapsCount} Predatory Trap(s)
              </div>
            )}
          </div>
        </div>

        {/* Readability & Grade level */}
        <div className="glass-panel p-4 border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Readability Grade</div>
            <div className="text-xs font-bold text-slate-200 line-clamp-1">
              {analysis ? analysis.readingGradeLevel : 'Flesch-Kincaid Score'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>~{analysis?.readingTimeMinutes || 3} min read time</span>
            </div>
          </div>
        </div>

        {/* PII Shield Sanitization status */}
        <div className="glass-panel p-4 border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Client PII Shield</div>
            <div className="text-xs font-bold text-emerald-300">
              {redactionInfo.totalRedacted > 0 ? `${redactionInfo.totalRedacted} Sensitive Items Masked` : 'Zero Leaks Detected'}
            </div>
            <div className="text-[10px] text-slate-400">
              {showPIIMaskedView ? 'Viewing Sanitized Stream' : 'Viewing Raw Document'}
            </div>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="glass-panel p-4 border border-white/10 flex flex-col justify-center">
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className="btn-primary w-full justify-center text-xs py-3"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Analyzing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Deep Analysis (Gemini 3.8 Flash)</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-center text-slate-400 mt-1.5">
            Persona: <strong className="text-cyan-300 uppercase">{currentPersona}</strong>
          </div>
        </div>
      </div>

      {/* Document Inspector with PII Redaction Badges */}
      <div className="glass-panel p-5 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Document Preview</span>
            {showPIIMaskedView && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PII Protected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Clauses: {analysis?.clauses.length || 'Pending'}</span>
            <span>Words: {rawText.split(/\s+/).filter(Boolean).length}</span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap select-text">
          {displayedText}
        </div>
      </div>
    </div>
  );
};
