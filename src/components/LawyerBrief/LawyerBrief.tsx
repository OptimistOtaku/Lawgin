import React, { useState } from 'react';
import { DocumentAnalysis, LawyerIntakeDossier } from '../../types/legal';
import { GeminiService } from '../../services/geminiService';
import { Briefcase, Printer, Download, Sparkles, AlertOctagon, HelpCircle, FileText } from 'lucide-react';

interface LawyerBriefProps {
  analysis: DocumentAnalysis;
  userRole?: string;
}

export const LawyerBrief: React.FC<LawyerBriefProps> = ({ analysis, userRole = 'Prospective Signatory / Client' }) => {
  const [dossier, setDossier] = useState<LawyerIntakeDossier | null>(null);

  // Auto-generate default dossier on mount
  React.useEffect(() => {
    const fetchDossier = async () => {
      const res = await GeminiService.generateLawyerBrief(analysis, userRole);
      setDossier(res);
    };
    fetchDossier();
  }, [analysis.id, userRole, analysis, userRole]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!dossier) return;
    const mdContent = `# ATTORNEY CONSULTATION INTAKE BRIEFING DOSSIER
Generated via Lawgin AI Legal Intelligence Platform
Date: ${new Date().toLocaleDateString()}

## Document Overview
- **Document Under Review:** ${dossier.documentTitle}
- **Client Role:** ${dossier.userRole}
- **Overall Risk Index:** ${analysis.overallRiskScore}/100 (${analysis.overallRiskVerdict})
- **Recommended Attorney Review Focus:** ${dossier.estimatedReviewFocus}

## Executive Summary
${dossier.summaryOfEngagement}

## Primary Client Objectives
${dossier.primaryGoals.map(g => `- ${g}`).join('\n')}

## Flagged Red-Flag Clauses for Urgent Review
${dossier.redFlagClauses.map(c => `### § ${c.clauseNumber} - ${c.title}
- **Legal Risk:** ${c.riskReason}
- **Desired Resolution:** ${c.desiredOutcome}
`).join('\n')}

## Identified Ambiguities & Drafting Gaps
${dossier.unresolvedAmbiguities.map(a => `- ${a}`).join('\n')}

## 5 Strategic Questions for Licensed Counsel
${dossier.targetQuestionsForAttorney.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---
*Disclaimer: This briefing dossier is generated for preparation purposes to optimize billable legal consultation time and does not replace formal legal advice.*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lawyer_Intake_Brief_${analysis.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 border border-white/10 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Attorney Consultation Intake Dossier</h2>
              <p className="text-xs text-slate-400">
                A 1-page structured briefing document designed to save you hundreds of dollars in billable legal fees.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadMarkdown}
              disabled={!dossier}
              className="btn-secondary text-xs flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Dossier (.md)
            </button>
            <button
              onClick={handlePrint}
              disabled={!dossier}
              className="btn-primary text-xs flex-1 sm:flex-initial"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Structured Dossier Document Body */}
      {dossier ? (
        <div className="glass-panel p-8 border border-white/15 bg-slate-900/90 text-slate-100 space-y-6 shadow-2xl relative font-sans">
          
          {/* Header Bar */}
          <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Attorney Consultation Briefing
                </span>
                <span className="text-xs font-mono text-slate-400">Date: {new Date().toLocaleDateString()}</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1.5">{dossier.documentTitle}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Prepared for: <strong className="text-slate-200">{dossier.userRole}</strong></p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Risk Index</span>
              <span className="badge badge-critical text-xs px-3 py-1 font-mono">
                {analysis.overallRiskScore}/100 • {analysis.overallRiskVerdict}
              </span>
            </div>
          </div>

          {/* Review Focus Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300">Recommended 30-Minute Consultation Focus: </strong>
              <span className="text-slate-300">{dossier.estimatedReviewFocus}</span>
            </div>
          </div>

          {/* Section 1: Executive Engagement Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              1. Engagement Summary & Context
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
              {dossier.summaryOfEngagement}
            </p>
          </div>

          {/* Section 2: Flagged Clauses for Counsel Review */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              2. High-Exposure Provisions Requiring Legal Review ({dossier.redFlagClauses.length})
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {dossier.redFlagClauses.map((clause, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300">
                      § {clause.clauseNumber} - {clause.title}
                    </span>
                    <span className="badge badge-critical text-[10px]">High Priority</span>
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-slate-400">Risk Assessment: </strong>{clause.riskReason}
                  </div>
                  <div className="text-emerald-300">
                    <strong className="text-slate-400">Desired Outcome: </strong>{clause.desiredOutcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Ambiguities & Drafting Gaps */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              3. Unresolved Ambiguities & Silent Provisions
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              {dossier.unresolvedAmbiguities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: 5 Strategic Questions for Attorney */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              4. Five Targeted Questions to Ask Your Attorney
            </h3>
            <div className="space-y-2">
              {dossier.targetQuestionsForAttorney.map((q, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-100">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-500 text-center">
            Prepared with Lawgin AI Document Intelligence. Designed to streamline client-attorney intake and maximize consultation efficiency.
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-xs text-slate-400 space-y-3">
          <Sparkles className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
          <p>Compiling Attorney Consultation Dossier...</p>
        </div>
      )}
    </div>
  );
};
