import React, { useState } from 'react';
import { ComparisonDiffItem, ComparisonResult } from '../../types/legal';
import { SampleContract } from '../../data/sampleContracts';
import { GeminiService } from '../../services/geminiService';
import { GitCompare, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ContractComparatorProps {
  currentContract: SampleContract;
}

export const ContractComparator: React.FC<ContractComparatorProps> = ({ currentContract }) => {
  const [docAName, setDocAName] = useState(
    currentContract.comparisonBaselineName || 'Balanced Industry Standard Model'
  );
  const [docAText, setDocAText] = useState(
    currentContract.comparisonBaselineText || 'Standard terms with mutual 30-day notice and capped liability.'
  );

  const [docBName, setDocBName] = useState(currentContract.title);
  const [docBText, setDocBText] = useState(currentContract.text);

  const [filter, setFilter] = useState<'all' | 'unfavorable' | 'favorable'>('all');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Auto-run default comparison on first mount or contract change
  React.useEffect(() => {
    const runDefault = async () => {
      setIsComparing(true);
      const res = await GeminiService.compareContracts(
        currentContract.comparisonBaselineName || 'Balanced Model',
        currentContract.comparisonBaselineText || '',
        currentContract.title,
        currentContract.text
      );
      setComparisonResult(res);
      setIsComparing(false);
    };
    runDefault();
  }, [currentContract.id]);

  const handleManualCompare = async () => {
    setIsComparing(true);
    const res = await GeminiService.compareContracts(docAName, docAText, docBName, docBText);
    setComparisonResult(res);
    setIsComparing(false);
  };

  const filteredDiffs = (comparisonResult?.diffs || []).filter(item => {
    if (filter === 'all') return true;
    if (filter === 'unfavorable') return item.impactVerdict === 'unfavorable';
    if (filter === 'favorable') return item.impactVerdict === 'favorable';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-5 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Side-by-Side Contract Redline & Comparison</h2>
              <p className="text-xs text-slate-400">
                Compare counterparty draft against standard protections or compare two versions of an agreement.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualCompare}
            disabled={isComparing}
            className="btn-primary text-xs"
          >
            {isComparing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Comparing Versions...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Re-Analyze Differences
              </>
            )}
          </button>
        </div>

        {/* Contract Names & Status Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Document A (Baseline / Fair Model)</span>
            <div className="text-xs font-semibold text-slate-200 mt-1">{docAName}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Document B (Proposed Counterparty Draft)</span>
            <div className="text-xs font-semibold text-slate-200 mt-1">{docBName}</div>
          </div>
        </div>
      </div>

      {/* Comparison Verdict Summary Banner */}
      {comparisonResult && (
        <div className="glass-panel p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-950 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Comparison Verdict</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">{comparisonResult.summaryVerdict}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="badge badge-critical text-xs">
                {comparisonResult.unfavorableChangesCount} Unfavorable Risks
              </span>
              <span className="badge badge-low text-xs">
                {comparisonResult.favorableChangesCount} Favorable Terms
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Differences ({comparisonResult.diffs.length})
            </button>
            <button
              onClick={() => setFilter('unfavorable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === 'unfavorable' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unfavorable / Risky ({comparisonResult.unfavorableChangesCount})
            </button>
            <button
              onClick={() => setFilter('favorable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === 'favorable' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Favorable ({comparisonResult.favorableChangesCount})
            </button>
          </div>
        </div>
      )}

      {/* Side-by-side Clause Differences List */}
      <div className="space-y-4">
        {filteredDiffs.map((diff: ComparisonDiffItem) => {
          const isUnfavorable = diff.impactVerdict === 'unfavorable';
          const isFavorable = diff.impactVerdict === 'favorable';

          return (
            <div
              key={diff.id}
              className={`glass-panel border rounded-xl overflow-hidden transition-all ${
                isUnfavorable
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isFavorable
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : 'border-white/10'
              }`}
            >
              {/* Header Bar */}
              <div className="p-4 bg-slate-900/80 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Category: {diff.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    isUnfavorable ? 'badge-critical' : isFavorable ? 'badge-low' : 'badge-medium'
                  }`}>
                    {diff.impactVerdict} for you
                  </span>
                </div>
              </div>

              {/* Side by side comparison columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 text-xs">
                {/* Doc A */}
                <div className="p-4 space-y-1.5 bg-slate-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Doc A ({docAName})
                  </span>
                  <div className="font-semibold text-slate-200">{diff.docAClauseTitle}</div>
                  <p className="font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{diff.docAClauseText}"
                  </p>
                </div>

                {/* Doc B */}
                <div className="p-4 space-y-1.5 bg-slate-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Doc B ({docBName})
                  </span>
                  <div className="font-semibold text-slate-200">{diff.docBClauseTitle}</div>
                  <p className="font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{diff.docBClauseText}"
                  </p>
                </div>
              </div>

              {/* Legal Explanation & Pushback Strategy */}
              <div className="p-4 bg-slate-900/60 border-t border-white/5 space-y-2 text-xs">
                <div>
                  <strong className="text-amber-300">Why this difference matters: </strong>
                  <span className="text-slate-300">{diff.explanation}</span>
                </div>
                <div>
                  <strong className="text-emerald-300">Recommended Negotiation Position: </strong>
                  <span className="text-emerald-200">{diff.recommendation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
