import React, { useState } from 'react';
import { Clause, ScenarioSimulationResult } from '../../types/legal';
import { SampleContract } from '../../data/sampleContracts';
import { GeminiService } from '../../services/geminiService';
import { PlayCircle, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, Lightbulb } from 'lucide-react';

interface ScenarioSimulatorProps {
  currentContract: SampleContract;
  clauses: Clause[];
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ currentContract, clauses }) => {
  const [customScenario, setCustomScenario] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<ScenarioSimulationResult | null>(null);

  const handleSimulate = async (scenarioText: string) => {
    if (!scenarioText.trim() || isSimulating) return;
    setIsSimulating(true);

    const simulation = await GeminiService.simulateScenario(
      scenarioText,
      currentContract.text,
      clauses
    );
    setResult(simulation);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="glass-panel p-5 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">"What If?" Contract Scenario Simulator</h2>
            <p className="text-xs text-slate-400">
              Test real-world scenarios to preview your legal rights, financial penalties, and contractual remedies.
            </p>
          </div>
        </div>

        {/* Suggested scenarios */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Preset Scenarios for {currentContract.title}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {currentContract.suggestedScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  setCustomScenario(sc);
                  handleSimulate(sc);
                }}
                disabled={isSimulating}
                className="text-xs p-3 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-200 text-left transition-all"
              >
                <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1">Scenario {i + 1}</div>
                <div>{sc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom scenario input */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="Or enter your custom situation (e.g. 'What if I sublet one room on Airbnb?')..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            onClick={() => handleSimulate(customScenario)}
            disabled={!customScenario.trim() || isSimulating}
            className="btn-primary text-xs justify-center sm:w-auto"
          >
            {isSimulating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Simulating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Result Output */}
      {result && (
        <div className="glass-panel p-6 border border-cyan-500/30 space-y-5 animate-fade-in">
          {/* Verdict Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Scenario Tested</span>
              <h3 className="text-sm font-bold text-white mt-0.5">"{result.scenarioQuery}"</h3>
            </div>

            <div className="shrink-0">
              <span className={`badge text-xs px-3 py-1.5 ${
                result.allowed === true
                  ? 'badge-low'
                  : result.allowed === false
                  ? 'badge-critical'
                  : 'badge-medium'
              }`}>
                {result.contractVerdict}
              </span>
            </div>
          </div>

          {/* Involved Clauses & Financial Consequences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Financial Exposure & Damages
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.financialConsequences}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Legal Risks & Contractual Breaches
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.legalRisks}
              </p>
            </div>
          </div>

          {/* Step-by-Step Action Plan */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              Recommended Step-by-Step Action Plan
            </h4>
            <div className="space-y-2">
              {result.stepByStepActionPlan.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Alternative Advice */}
          {result.safeAlternativeAdvice && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 text-xs text-emerald-300">
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Lightbulb className="w-4 h-4" />
                <span>Strategic Negotiation Alternative:</span>
              </div>
              <p className="text-slate-200">{result.safeAlternativeAdvice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
