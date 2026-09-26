import React, { useState } from 'react';
import { ComplianceChecklistItem, DocumentAnalysis, RedlineCounterProposal } from '../../types/legal';
import { GeminiService } from '../../services/geminiService';
import confetti from 'canvas-confetti';
import { CheckSquare, Calendar, Mail, Copy, Check, Sparkles, AlertCircle, Clock, Send } from 'lucide-react';

interface ActionChecklistProps {
  analysis: DocumentAnalysis;
  counterpartName: string;
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({ analysis, counterpartName }) => {
  // Generate initial checklist from analysis
  const [checklist, setChecklist] = useState<ComplianceChecklistItem[]>([
    {
      id: 'item-1',
      title: 'Calendar 60-Day Non-Renewal Notice Deadline',
      dueDateOrTrigger: '60 days prior to contract expiration',
      description: 'Set a calendar reminder to issue written non-renewal via certified mail to prevent evergreen 12-month lock-in.',
      responsibleParty: 'You',
      priority: 'high',
      completed: false,
      clauseRef: '§ 2'
    },
    {
      id: 'item-2',
      title: 'Move-in Condition Inspection & Photos',
      dueDateOrTrigger: 'Within 48 hours of key handover',
      description: 'Document all pre-existing wear and tear with timestamped photos to protect against non-refundable security deposit claims.',
      responsibleParty: 'You',
      priority: 'high',
      completed: false,
      clauseRef: '§ 4'
    },
    {
      id: 'item-3',
      title: 'Security Deposit Accounting & Return Verification',
      dueDateOrTrigger: 'Within 21-30 days of surrender',
      description: 'Request itemized receipts for any cleaning deductions or maintenance withholdings.',
      responsibleParty: 'Counterparty',
      priority: 'medium',
      completed: false,
      clauseRef: '§ 4'
    },
    {
      id: 'item-4',
      title: 'Confirm Payment Grace Period & Late Fee Threshold',
      dueDateOrTrigger: '1st of each calendar month',
      description: 'Set up automated bank transfer to avoid immediate 10% acceleration penalties on the 2nd day.',
      responsibleParty: 'You',
      priority: 'medium',
      completed: false,
      clauseRef: '§ 3'
    }
  ]);

  const [counterProposal, setCounterProposal] = useState<RedlineCounterProposal | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const toggleCheck = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      const allDone = updated.every(item => item.completed);
      if (allDone) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      return updated;
    });
  };

  const handleGenerateProposal = async () => {
    setIsGeneratingProposal(true);
    const proposal = await GeminiService.generateCounterProposal(analysis, counterpartName);
    setCounterProposal(proposal);
    setIsGeneratingProposal(false);
  };

  const handleCopyProposal = () => {
    if (!counterProposal) return;
    const fullText = `Subject: ${counterProposal.subjectLine}\n\n${counterProposal.emailBody}\n\nPROPOSED AMENDMENTS:\n${counterProposal.proposedModifications.map(m => `--- ${m.clauseTitle} (${m.clauseNumber}) ---\nProposed: ${m.proposedLanguage}\nJustification: ${m.businessJustification}\n`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const completedCount = checklist.filter(c => c.completed).length;

  return (
    <div className="space-y-6">
      {/* Checklist Card */}
      <div className="glass-panel p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Actionable Compliance & Deadlines Checklist</h2>
              <p className="text-xs text-slate-400">
                Track mandatory notice windows, payment schedules, and contractual conditions.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
            {completedCount} / {checklist.length} Completed
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3 select-none ${
                item.completed
                  ? 'border-emerald-500/30 bg-emerald-950/15 opacity-75'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => {}} // handled by parent onClick
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 mt-0.5 cursor-pointer"
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.clauseRef && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.clauseRef}
                      </span>
                    )}
                    <span className={`badge text-[10px] ${
                      item.priority === 'high' ? 'badge-critical' : 'badge-medium'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{item.description}</p>

                <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono pt-1">
                  <Clock className="w-3 h-3" />
                  <span>Trigger: {item.dueDateOrTrigger}</span>
                  <span className="text-slate-500">• Party: {item.responsibleParty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counter-Proposal & Redline Email Generator */}
      <div className="glass-panel p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Counter-Proposal & Redline Draft Generator</h3>
              <p className="text-xs text-slate-400">
                Generate a professional negotiation email with balanced replacement language for flagged clauses.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateProposal}
            disabled={isGeneratingProposal}
            className="btn-primary text-xs"
          >
            {isGeneratingProposal ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Drafting Amendments...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Generate Negotiation Draft
              </>
            )}
          </button>
        </div>

        {counterProposal ? (
          <div className="space-y-4 animate-fade-in">
            {/* Email subject & body */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                <span className="text-slate-400">
                  Subject: <strong className="text-slate-100">{counterProposal.subjectLine}</strong>
                </span>
                <button
                  onClick={handleCopyProposal}
                  className="btn-secondary text-xs py-1 px-2.5"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied to Clipboard' : 'Copy Email & Redlines'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {counterProposal.emailBody}
              </div>
            </div>

            {/* Proposed Redline Clauses */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Proposed Clause Amendments ({counterProposal.proposedModifications.length})
              </span>

              {counterProposal.proposedModifications.map((mod, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      § {mod.clauseNumber} - {mod.clauseTitle}
                    </span>
                    <span className="badge badge-low text-[10px]">Balanced Proposal</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                    <span className="font-bold block mb-0.5 text-rose-400">Current Clause Language:</span>
                    "{mod.originalLanguage}"
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 font-mono text-[11px]">
                    <span className="font-bold block mb-0.5 text-emerald-400">Proposed Redline Substitute:</span>
                    "{mod.proposedLanguage}"
                  </div>

                  <p className="text-slate-400 text-[11px]">
                    <strong className="text-slate-300">Business Justification: </strong>
                    {mod.businessJustification}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            Click <strong>"Generate Negotiation Draft"</strong> to craft a courteous, balanced counter-proposal email tailored to this agreement.
          </div>
        )}
      </div>
    </div>
  );
};
