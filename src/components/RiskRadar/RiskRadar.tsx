import React, { useEffect, useState } from 'react';
import { Clause, DocumentAnalysis } from '../../types/legal';
import { ShieldAlert, AlertOctagon, CheckCircle2, Zap, Scale } from 'lucide-react';

interface RiskRadarProps {
  analysis: DocumentAnalysis;
  onSelectClause?: (clauseId: string) => void;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ analysis, onSelectClause }) => {
  const predatoryClauses = analysis.clauses.filter(c => c.isPredatory);
  const highRiskClauses = analysis.clauses.filter(c => !c.isPredatory && (c.riskLevel === 'high' || c.riskLevel === 'critical'));

  const score = analysis.overallRiskScore;

  // Animated count-up for the exposure index (respects reduced motion)
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setAnimatedScore(score);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedScore(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  // Gauge color calculation
  const gaugeColor =
    score > 75 ? '#B04A32' : score > 50 ? '#C49338' : score > 25 ? '#C9A227' : '#5C7F4A';

  return (
    <div className="space-y-6">
      {/* Top Banner: Score Gauge & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Speedometer Risk Index Card */}
        <div className="glass-panel p-6 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
            Contract Risk Exposure Index
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90 text-cyan-700/50" viewBox="0 0 100 100">
              {/* Classical tick ring */}
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 5" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1={50 + Math.cos((i / 12) * Math.PI * 2) * 43}
                  y1={50 + Math.sin((i / 12) * Math.PI * 2) * 43}
                  x2={50 + Math.cos((i / 12) * Math.PI * 2) * 46.5}
                  y2={50 + Math.sin((i / 12) * Math.PI * 2) * 46.5}
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              ))}
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
              />
              {/* Animated Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={gaugeColor}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * score) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-display font-extrabold text-gilded tracking-tight">{animatedScore}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400">Index / 100</span>
            </div>
          </div>

          <div className="mt-2">
            <span
              className={`badge text-xs px-3 py-1 ${
                score > 75
                  ? 'badge-critical'
                  : score > 50
                  ? 'badge-high'
                  : score > 25
                  ? 'badge-medium'
                  : 'badge-low'
              }`}
            >
              {analysis.overallRiskVerdict}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-3 max-w-xs">
            Based on algorithmic evaluation of indemnity caps, termination penalties, and statutory rights.
          </p>
        </div>

        {/* Category Breakdown Bars */}
        <div className="glass-panel p-6 border border-white/10 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                Risk Exposure by Legal Category
              </h3>
              <span className="text-xs text-slate-400">{analysis.categoryBreakdown.length} Categories Analyzed</span>
            </div>

            <div className="space-y-3.5">
              {analysis.categoryBreakdown.map((cat, idx) => {
                const barColor =
                  cat.score > 70 ? 'bg-rose-500' : cat.score > 40 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{cat.category}</span>
                      <span className="font-mono text-slate-400">
                        {cat.score}% risk • {cat.clauseCount} clause(s)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-300">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>{predatoryClauses.length} Predatory Clause(s) Flagged</span>
            </span>
            <span>Lawgin Heuristics v2.5</span>
          </div>
        </div>
      </div>

      {/* Sneaky Trap Detector Section */}
      <div className="glass-panel p-5 border border-rose-500/20 bg-rose-950/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Sneaky Trap Radar: Hidden Predatory Clauses</span>
              <span className="badge badge-critical text-[10px]">{predatoryClauses.length} Detected</span>
            </h3>
            <p className="text-xs text-slate-400">
              Asymmetrical terms that heavily favor the counterparty or waive statutory protections.
            </p>
          </div>
        </div>

        {predatoryClauses.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>No predatory or evergreen traps detected in this contract version!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {predatoryClauses.map((clause: Clause) => (
              <div
                key={clause.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectClause && onSelectClause(clause.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectClause) {
                    e.preventDefault();
                    onSelectClause(clause.id);
                  }
                }}
                title="Open this clause in the Plain-English view"
                className="p-4 rounded-xl border border-rose-500/40 bg-slate-900/90 space-y-2.5 hover:border-rose-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      § {clause.number}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{clause.title}</h4>
                  </div>
                  <span className="badge badge-critical text-[10px]">Critical Asymmetry</span>
                </div>

                <div className="text-xs text-rose-200/90 font-medium bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20">
                  <strong>Why it's dangerous: </strong>
                  {clause.predatoryReason || clause.riskExplanation}
                </div>

                <div className="font-mono text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
                  "{clause.originalText}"
                </div>

                {clause.suggestedAlternative && (
                  <div className="text-xs bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/30 text-emerald-300">
                    <strong className="text-emerald-400">Recommended Pushback: </strong>
                    <span>{clause.suggestedAlternative}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other High Risk Cautions */}
      {highRiskClauses.length > 0 && (
        <div className="glass-panel p-5 border border-amber-500/20 bg-amber-950/10 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Additional High-Caution Clauses ({highRiskClauses.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highRiskClauses.map((clause: Clause) => (
              <div
                key={clause.id}
                className="p-3.5 rounded-xl border border-amber-500/30 bg-slate-900/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">§ {clause.number} - {clause.title}</span>
                  <span className="badge badge-high text-[10px]">{clause.riskLevel}</span>
                </div>
                <p className="text-xs text-slate-400">{clause.riskExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
