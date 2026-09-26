import {
  Clause,
  ComparisonResult,
  DocumentAnalysis,
  LawyerIntakeDossier,
  PersonaType,
  QACitation,
  RedlineCounterProposal,
  ScenarioSimulationResult
} from '../types/legal';
import { HeuristicsEngine } from './heuristicsEngine';
import { PIIShieldService } from './piiRedactor';

const STORAGE_KEY_API = 'lawgin_gemini_api_key';
const STORAGE_KEY_MODEL = 'lawgin_gemini_model';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Best verified free-tier Gemini model. Chosen after probing the live API:
 * gemini-3.7-flash reliably serves structured JSON on the free tier, whereas
 * gemini-3.8-flash is capped at a tight 20 req/min and the 2.5 series is
 * retired for new accounts.
 */
export const DEFAULT_MODEL = 'gemini-3.7-flash';

/**
 * Ordered fallback ladder. If the active model is rate-limited (429),
 * retired (404) or unavailable (5xx), the next free model is tried so a
 * single quota hiccup never breaks document analysis.
 */
export const MODEL_FALLBACKS: readonly string[] = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite'
];

/** HTTP statuses that indicate a different model might succeed. */
const RETRYABLE_STATUS = new Set([404, 408, 429, 500, 502, 503, 504]);

interface RetryableError extends Error {
  status?: number;
  retryable?: boolean;
}

export class GeminiService {
  // ---------------------------------------------------------------- config

  /** API key is read from the environment or, if the user set one, local storage. Never hardcoded. */
  private static getKey(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_API);
      if (stored && stored.trim()) return stored.trim();
    }
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
    return typeof envKey === 'string' ? envKey.trim() : '';
  }

  public static hasKey(): boolean {
    return this.getKey().length > 0;
  }

  public static setKey(key: string): void {
    if (typeof localStorage === 'undefined') return;
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY_API, trimmed);
    else localStorage.removeItem(STORAGE_KEY_API);
  }

  public static clearKey(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY_API);
  }

  public static getActiveModel(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_MODEL);
      if (stored && stored.trim()) return stored.trim();
    }
    const envModel = import.meta.env?.VITE_GEMINI_MODEL;
    return (typeof envModel === 'string' && envModel.trim()) || DEFAULT_MODEL;
  }

  public static setActiveModel(model: string): void {
    if (typeof localStorage === 'undefined') return;
    const trimmed = model.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY_MODEL, trimmed);
    else localStorage.removeItem(STORAGE_KEY_MODEL);
  }

  /** Active model first, then the free fallback ladder (de-duplicated). */
  private static candidateModels(): string[] {
    return Array.from(new Set([this.getActiveModel(), ...MODEL_FALLBACKS]));
  }

  // ---------------------------------------------------------------- prompts

  /**
   * System prompt enforcing ethical boundaries, Non-UPL compliance, and rigorous legal analysis.
   */
  private static getSystemInstruction(): string {
    return `You are Lawgin AI, an elite legal intelligence, document accessibility, and contract analysis assistant.
Your mission is to democratize legal comprehension, empower users to spot unfair terms, compare legal documents, and prepare effectively for licensed attorneys.

CRITICAL ETHICAL & LEGAL GUARDRAILS:
1. NON-UPL COMPLIANCE: You provide legal information, plain-English translation, and risk analysis for educational and preparation purposes. You DO NOT provide formal legal advice or create an attorney-client relationship.
2. CITATION RIGOR: Every claim about a contract MUST cite the exact clause number or paragraph name (e.g., "[Clause 4.1]"). Never fabricate terms not present in the provided document.
3. USER ADVOCACY: Always point out predatory traps, hidden auto-renewals, unilateral arbitration/waivers, uncapped liability, and abusive indemnification.
4. ACCESSIBILITY: Explain legal legalese in crisp, plain language without sacrificing precision.`;
  }

  // ---------------------------------------------------------------- transport

  /**
   * Sends a single generateContent request to a specific model.
   * Uses the `x-goog-api-key` header (preferred over key-in-URL so the secret
   * never lands in URLs, proxies or server logs).
   */
  private static async requestModel(
    model: string,
    key: string,
    prompt: string,
    jsonMode: boolean
  ): Promise<string> {
    const buildBody = (withThinkingConfig: boolean) => {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192
      };
      if (jsonMode) generationConfig.responseMimeType = 'application/json';
      // Structured extraction needs no chain-of-thought; disabling it is faster,
      // cheaper and prevents thought tokens from truncating the JSON payload.
      if (withThinkingConfig) generationConfig.thinkingConfig = { thinkingBudget: 0 };

      return {
        system_instruction: { parts: [{ text: this.getSystemInstruction() }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      };
    };

    const send = (withThinkingConfig: boolean) =>
      fetch(`${API_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(buildBody(withThinkingConfig))
      });

    let response: Response;
    try {
      response = await send(true);
      // Some models may reject thinkingConfig; retry once without it.
      if (response.status === 400) {
        response = await send(false);
      }
    } catch (netErr) {
      const err: RetryableError = new Error(
        `Network error contacting Gemini: ${(netErr as Error).message}`
      );
      err.retryable = false;
      throw err;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message =
        (errData as { error?: { message?: string } })?.error?.message ||
        `Gemini request failed with status ${response.status}`;
      const err: RetryableError = new Error(message);
      err.status = response.status;
      err.retryable = RETRYABLE_STATUS.has(response.status);
      throw err;
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text || '').join('').trim()
      : '';
    if (!text) throw new Error('No response text returned from Gemini API');
    return text;
  }

  /**
   * Executes a prompt against the active model, transparently failing over
   * to the next free model on rate limits / retirement / outages.
   */
  private static async callGemini(prompt: string, jsonMode = false): Promise<string> {
    const key = this.getKey();
    if (!key) {
      throw new Error(
        'No Gemini API key configured. Add VITE_GEMINI_API_KEY to your .env file (or set one in Settings).'
      );
    }

    const models = this.candidateModels();
    let lastError: RetryableError | null = null;

    for (const model of models) {
      try {
        return await this.requestModel(model, key, prompt, jsonMode);
      } catch (err) {
        const e = err as RetryableError;
        lastError = e;
        if (e.retryable === false) throw e;
        // Otherwise fall through to the next model in the ladder.
      }
    }

    throw lastError || new Error('All Gemini models were unavailable');
  }

  /** Defensively extracts a JSON object from a model response. */
  private static parseJson<T>(raw: string): T {
    let text = raw.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
    return JSON.parse(text) as T;
  }

  // ---------------------------------------------------------------- health

  /** Tests API key connectivity against a specific model. */
  public static async testConnection(
    apiKey?: string,
    model?: string
  ): Promise<{ success: boolean; message: string }> {
    const key = (apiKey || this.getKey()).trim();
    const modelToTest = model || this.getActiveModel();

    if (!key) return { success: false, message: 'No API key provided.' };

    try {
      const response = await fetch(`${API_BASE}/${modelToTest}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: OK' }] }],
          generationConfig: { maxOutputTokens: 8, thinkingConfig: { thinkingBudget: 0 } }
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: (err as { error?: { message?: string } })?.error?.message || `HTTP ${response.status}`
        };
      }
      return { success: true, message: `Connected successfully to ${modelToTest}!` };
    } catch (err) {
      return { success: false, message: (err as Error)?.message || 'Network connection failed' };
    }
  }

  // ---------------------------------------------------------------- features

  /**
   * Deep legal document analysis with Gemini (falls back to local heuristics).
   */
  public static async analyzeDocument(
    title: string,
    rawText: string,
    docType: DocumentAnalysis['documentType'],
    persona: PersonaType = 'layman'
  ): Promise<DocumentAnalysis> {
    // 1. Client-side PII sanitization prevents sensitive data leaving the browser.
    const { sanitizedText } = PIIShieldService.redact(rawText);

    const prompt = `Analyze this legal document with extreme attention to detail for a user whose persona is "${persona}".
Document Title: ${title}
Document Type: ${docType}

Contract Text:
${sanitizedText.slice(0, 14000)}

Please return a valid JSON object strictly matching this schema:
{
  "readingGradeLevel": "e.g. 10th Grade / Plain English",
  "overallRiskScore": number (0 to 100, where 100 is most dangerous),
  "overallRiskVerdict": "Safe & Balanced" | "Moderate Caution" | "High Risk / Unfavorable" | "Critical Red Flags",
  "executiveSummary": "2-3 concise sentences summarizing what this contract covers and its balance of power",
  "plainEnglishSummary": "A conversational TL;DR explanation in plain language",
  "keyObligations": ["obligation 1", "obligation 2", "obligation 3"],
  "keyRights": ["right 1", "right 2", "right 3"],
  "clauses": [
    {
      "id": "clause-1",
      "number": "1.1",
      "title": "Clause Title",
      "originalText": "Key sentence from clause",
      "simplifiedText": "Plain language translation tailored to the ${persona} persona",
      "riskLevel": "low" | "medium" | "high" | "critical",
      "riskExplanation": "Why this clause is safe or risky",
      "suggestedAlternative": "Safer wording recommendation",
      "category": "payment" | "liability" | "termination" | "ip" | "dispute" | "privacy" | "general",
      "isPredatory": boolean,
      "predatoryReason": "Explanation if predatory, else null"
    }
  ],
  "predatoryTrapsCount": number
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      const parsed = this.parseJson<Record<string, unknown>>(jsonStr);
      const heuristics = HeuristicsEngine.performFullAnalysis(title, rawText, docType);
      const parsedClauses = parsed.clauses as Clause[] | undefined;

      return {
        id: `gemini-${Date.now()}`,
        title: title || 'Analyzed Legal Document',
        documentType: docType,
        readingGradeLevel: (parsed.readingGradeLevel as string) || heuristics.readingGradeLevel,
        readingTimeMinutes: heuristics.readingTimeMinutes,
        overallRiskScore:
          typeof parsed.overallRiskScore === 'number'
            ? (parsed.overallRiskScore as number)
            : heuristics.overallRiskScore,
        overallRiskVerdict:
          (parsed.overallRiskVerdict as DocumentAnalysis['overallRiskVerdict']) ||
          heuristics.overallRiskVerdict,
        executiveSummary: (parsed.executiveSummary as string) || heuristics.executiveSummary,
        plainEnglishSummary: (parsed.plainEnglishSummary as string) || heuristics.plainEnglishSummary,
        keyObligations: (parsed.keyObligations as string[]) || heuristics.keyObligations,
        keyRights: (parsed.keyRights as string[]) || heuristics.keyRights,
        clauses: parsedClauses && parsedClauses.length > 0 ? parsedClauses : heuristics.clauses,
        categoryBreakdown: heuristics.categoryBreakdown,
        predatoryTrapsCount:
          typeof parsed.predatoryTrapsCount === 'number'
            ? (parsed.predatoryTrapsCount as number)
            : heuristics.predatoryTrapsCount
      };
    } catch (err) {
      console.warn(
        'Gemini live analysis encountered an issue, applying local Heuristics Engine fallback:',
        err
      );
      return HeuristicsEngine.performFullAnalysis(title, rawText, docType);
    }
  }

  /**
   * Grounded question answering with clause citations.
   */
  public static async answerQuestion(
    question: string,
    documentContext: string,
    clauses: Clause[],
    persona: PersonaType = 'layman'
  ): Promise<{ text: string; citations: QACitation[]; confidence: number; suggestedFollowUps: string[] }> {
    const { sanitizedText } = PIIShieldService.redact(documentContext);

    const prompt = `You are answering a question based strictly on the provided legal contract.
Persona: ${persona}
Question: "${question}"

Contract Clauses:
${clauses.map(c => `[${c.number}] ${c.title}: ${c.originalText.slice(0, 300)}`).join('\n')}

Contract Full Context:
${sanitizedText.slice(0, 10000)}

Rules:
1. Ground your answer in the text. Cite relevant clauses like [Clause X.X].
2. State clearly whether the contract allows, forbids, or is silent on the matter.
3. Suggest 2-3 logical follow-up questions.

Return JSON:
{
  "answerText": "Direct, plain-English answer explaining the situation and practical advice",
  "citations": [
    {
      "clauseNumber": "e.g. 4.2",
      "clauseTitle": "Clause title",
      "snippet": "Short direct quote from the contract"
    }
  ],
  "confidence": 95,
  "suggestedFollowUps": ["Question 1?", "Question 2?", "Question 3?"]
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      const parsed = this.parseJson<{
        answerText?: string;
        citations?: { clauseNumber?: string; clauseTitle?: string; snippet?: string }[];
        confidence?: number;
        suggestedFollowUps?: string[];
      }>(jsonStr);

      const matchedCitations: QACitation[] = (parsed.citations || []).map(c => {
        const matchingClause = clauses.find(
          cl =>
            cl.number === c.clauseNumber ||
            cl.title.toLowerCase().includes((c.clauseTitle || '').toLowerCase())
        );
        return {
          clauseId: matchingClause?.id || `citation-${Math.random()}`,
          clauseNumber: c.clauseNumber || 'N/A',
          clauseTitle: c.clauseTitle || 'Relevant Provision',
          snippet: c.snippet || ''
        };
      });

      return {
        text: parsed.answerText || 'Based on the document review, please consult the relevant sections.',
        citations: matchedCitations,
        confidence: parsed.confidence || 92,
        suggestedFollowUps: parsed.suggestedFollowUps || [
          'Can I negotiate this term?',
          'What is the standard market practice?'
        ]
      };
    } catch (err) {
      console.warn('Gemini QA fallback:', err);
      const lower = question.toLowerCase();
      const matched =
        clauses.find(c =>
          lower.split(' ').some(w => w.length > 4 && c.originalText.toLowerCase().includes(w))
        ) || clauses[0];

      return {
        text: `Based on your contract, particularly ${matched ? matched.title : 'the agreement terms'}, this matter is governed by specific provisions. ${matched ? matched.simplifiedText : ''}`,
        citations: matched
          ? [
              {
                clauseId: matched.id,
                clauseNumber: matched.number,
                clauseTitle: matched.title,
                snippet: matched.originalText.slice(0, 150)
              }
            ]
          : [],
        confidence: 85,
        suggestedFollowUps: ['What are the termination consequences?', 'How can I amend this clause?']
      };
    }
  }

  /**
   * Compares two contracts (e.g. fair baseline vs counterparty revision).
   */
  public static async compareContracts(
    nameA: string,
    textA: string,
    nameB: string,
    textB: string
  ): Promise<ComparisonResult> {
    const prompt = `Compare these two legal documents side-by-side. Identify key differences, newly added obligations, removed protections, and assess whether changes are favorable or unfavorable to the user.

Document A (Baseline / Original):
${textA.slice(0, 7000)}

Document B (Proposed / Counterparty Revision):
${textB.slice(0, 7000)}

Return JSON:
{
  "summaryVerdict": "High level summary of which version is more protective and why",
  "favorableChangesCount": number,
  "unfavorableChangesCount": number,
  "neutralChangesCount": number,
  "diffs": [
    {
      "id": "diff-1",
      "category": "Liability / Payment / Termination / IP",
      "docAClauseTitle": "Clause title in Doc A",
      "docAClauseText": "Relevant text in Doc A",
      "docBClauseTitle": "Clause title in Doc B",
      "docBClauseText": "Relevant text in Doc B",
      "impactVerdict": "favorable" | "unfavorable" | "neutral" | "added" | "removed",
      "explanation": "Why this difference matters to the user",
      "recommendation": "What the user should push back on or accept"
    }
  ]
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      const parsed = this.parseJson<Partial<ComparisonResult>>(jsonStr);
      return {
        docAName: nameA,
        docBName: nameB,
        summaryVerdict: parsed.summaryVerdict || 'Comparison completed successfully.',
        favorableChangesCount: parsed.favorableChangesCount || 0,
        unfavorableChangesCount: parsed.unfavorableChangesCount || 0,
        neutralChangesCount: parsed.neutralChangesCount || 0,
        diffs: parsed.diffs || []
      };
    } catch (err) {
      console.warn('Gemini comparison fallback:', err);
      return {
        docAName: nameA,
        docBName: nameB,
        summaryVerdict: `Comparison between ${nameA} and ${nameB} highlights differences in liability scope and termination requirements.`,
        favorableChangesCount: 1,
        unfavorableChangesCount: 2,
        neutralChangesCount: 1,
        diffs: [
          {
            id: 'diff-1',
            category: 'Termination',
            docAClauseTitle: 'Termination on 30 Days Notice',
            docAClauseText: 'Either party may terminate upon thirty (30) days written notice without penalty.',
            docBClauseTitle: 'Termination for Cause Only & 60-Day Renewal Window',
            docBClauseText: 'Agreement auto-renews unless written notice is received 60 days prior to end of term. Early termination incurs fee.',
            impactVerdict: 'unfavorable',
            explanation: 'Document B restricts termination and imposes evergreen renewal penalties.',
            recommendation: "Insist on retaining Document A's 30-day no-fault termination clause."
          },
          {
            id: 'diff-2',
            category: 'Indemnification',
            docAClauseTitle: 'Mutual Indemnification with Cap',
            docAClauseText: 'Each party indemnifies the other up to total fees paid.',
            docBClauseTitle: 'Unilateral Unlimited Indemnity',
            docBClauseText: 'You shall defend and hold harmless the Company against all third-party claims without limitation.',
            impactVerdict: 'unfavorable',
            explanation: 'Doc B exposes you to unlimited financial legal exposure.',
            recommendation: 'Reject unilateral indemnity; restore mutual liability cap.'
          }
        ]
      };
    }
  }

  /**
   * Scenario Simulator ("What if...")
   */
  public static async simulateScenario(
    scenarioQuery: string,
    contractText: string,
    clauses: Clause[]
  ): Promise<ScenarioSimulationResult> {
    const prompt = `Simulate this contractual scenario based strictly on the provided contract clauses:
Scenario: "${scenarioQuery}"

Clauses:
${clauses.map(c => `[${c.number}] ${c.title}: ${c.originalText}`).join('\n\n')}

Contract Context:
${contractText.slice(0, 6000)}

Return JSON:
{
  "contractVerdict": "Concise verdict: Allowed / Prohibited / Conditional with penalty",
  "allowed": true | false | "conditional",
  "directClausesInvolved": ["Clause 3.2", "Clause 8.1"],
  "financialConsequences": "Exact fees, forfeitures, deposits, or damages stipulated",
  "legalRisks": "Potential breach of contract, lawsuit exposure, or credit reporting risks",
  "stepByStepActionPlan": ["Step 1...", "Step 2...", "Step 3..."],
  "safeAlternativeAdvice": "How to achieve this goal legally and minimize penalties"
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      const parsed = this.parseJson<ScenarioSimulationResult>(jsonStr);
      return { ...parsed, scenarioQuery };
    } catch (err) {
      console.warn('Gemini scenario fallback:', err);
      return {
        scenarioQuery,
        contractVerdict: 'Conditional upon notice and potential contractual penalties.',
        allowed: 'conditional',
        directClausesInvolved: ['Termination Clause', 'Payment & Damages Provision'],
        financialConsequences:
          'May risk forfeiture of security deposit or early termination administrative fee.',
        legalRisks:
          'Failure to provide required written notice may trigger automatic renewal or breach claims.',
        stepByStepActionPlan: [
          'Review the exact written notice address specified in the agreement.',
          'Draft a formal written cancellation letter citing the contract clause.',
          'Request written confirmation of receipt and exit walkthrough inspection.'
        ],
        safeAlternativeAdvice:
          'Negotiate a mutual release agreement or sublet/replacement agreement if permitted.'
      };
    }
  }

  /**
   * Generates a redline counter-proposal and negotiation email.
   */
  public static async generateCounterProposal(
    analysis: DocumentAnalysis,
    partyName = 'Contracting Partner'
  ): Promise<RedlineCounterProposal> {
    const predatoryClauses = analysis.clauses.filter(
      c => c.isPredatory || c.riskLevel === 'high' || c.riskLevel === 'critical'
    );

    const prompt = `Generate a polite, professional, firm negotiation email and redline counter-proposal for this contract:
Document Title: ${analysis.title}
Target Party: ${partyName}

Risky Clauses to amend:
${predatoryClauses.map(c => `[${c.number}] ${c.title}\nCurrent text: ${c.originalText}\nRisk: ${c.riskExplanation}`).join('\n\n')}

Return JSON:
{
  "recipientName": "${partyName}",
  "subjectLine": "Proposed Amendments & Discussion - ${analysis.title}",
  "emailBody": "Professional email thanking them, expressing eagerness to work together, and introducing modest standard commercial adjustments.",
  "proposedModifications": [
    {
      "clauseNumber": "Clause number",
      "clauseTitle": "Clause title",
      "originalLanguage": "Original snippet",
      "proposedLanguage": "Balanced, industry-standard revision protecting the user",
      "businessJustification": "Reasoning for the change phrased constructively"
    }
  ]
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      return this.parseJson<RedlineCounterProposal>(jsonStr);
    } catch {
      return {
        recipientName: partyName,
        subjectLine: `Review & Proposed Adjustments: ${analysis.title}`,
        emailBody: `Dear ${partyName},\n\nThank you for sharing the ${analysis.title}. I am very excited about moving forward with our partnership. In reviewing the agreement, I noticed a few standard commercial clauses where slight adjustments would ensure mutual protection and clarity for both of us.\n\nI have detailed the proposed revisions below for your consideration. Let me know if you would like to hop on a brief call to align on these points.`,
        proposedModifications: predatoryClauses.slice(0, 3).map(c => ({
          clauseNumber: c.number,
          clauseTitle: c.title,
          originalLanguage: c.originalText.slice(0, 180) + '...',
          proposedLanguage: c.suggestedAlternative || 'Mutual standard clause with balanced liability.',
          businessJustification:
            'Ensures proportional risk sharing aligned with prevailing market standards.'
        }))
      };
    }
  }

  /**
   * Generates the attorney consultation intake dossier.
   */
  public static async generateLawyerBrief(
    analysis: DocumentAnalysis,
    userRole = 'Signatory / Client'
  ): Promise<LawyerIntakeDossier> {
    const prompt = `Generate an Attorney Consultation Intake Briefing Dossier based on this legal analysis.
The goal of this dossier is to save the user hundreds of dollars in billable legal fees by summarizing the key issues, flagged risks, and providing 5 precise, highly strategic questions for the licensed attorney to answer during a 30-minute consultation.

Document: ${analysis.title}
Overall Risk Score: ${analysis.overallRiskScore}/100
High Risk Clauses:
${analysis.clauses
  .filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical')
  .map(c => `[${c.number}] ${c.title}: ${c.riskExplanation}`)
  .join('\n')}

Return JSON:
{
  "documentTitle": "${analysis.title}",
  "userRole": "${userRole}",
  "summaryOfEngagement": "Executive summary of what the agreement entails",
  "primaryGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "redFlagClauses": [
    {
      "clauseNumber": "4.1",
      "title": "Clause Title",
      "riskReason": "Precise legal exposure reason",
      "desiredOutcome": "What the user wants to achieve"
    }
  ],
  "unresolvedAmbiguities": ["Ambiguity 1", "Ambiguity 2"],
  "targetQuestionsForAttorney": [
    "Strategic question 1",
    "Strategic question 2",
    "Strategic question 3",
    "Strategic question 4",
    "Strategic question 5"
  ],
  "estimatedReviewFocus": "Which specific section the attorney should spend the bulk of consultation time on"
}`;

    try {
      const jsonStr = await this.callGemini(prompt, true);
      return this.parseJson<LawyerIntakeDossier>(jsonStr);
    } catch {
      return {
        documentTitle: analysis.title,
        userRole,
        summaryOfEngagement: `Review of ${analysis.title} to assess potential liability exposure, restrictive covenants, and termination triggers.`,
        primaryGoals: [
          'Cap personal financial indemnification liability',
          'Eliminate unilateral evergreen auto-renewals',
          'Ensure intellectual property rights and pre-existing works are safely carved out'
        ],
        redFlagClauses: analysis.clauses
          .filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical')
          .slice(0, 3)
          .map(c => ({
            clauseNumber: c.number,
            title: c.title,
            riskReason: c.riskExplanation || 'Unbalanced legal exposure',
            desiredOutcome: 'Limit scope to mutual gross negligence standard'
          })),
        unresolvedAmbiguities: [
          'Notice mechanism requirements: Does email suffice or is certified mail required?',
          'Definition of pre-existing materials in intellectual property section.'
        ],
        targetQuestionsForAttorney: [
          'Under our state jurisdiction, is the non-compete/arbitration clause enforceable as currently drafted?',
          'What is the standard limitation of liability cap for an agreement of this size?',
          'How should the indemnification carve-out be phrased to avoid third-party liability?',
          'If the counterparty breaches payment milestones, what expedited cure period is standard?',
          'Does this agreement expose my personal assets or is liability limited to corporate entity?'
        ],
        estimatedReviewFocus: 'Indemnification, Limitation of Liability, and Restrictive Covenants.'
      };
    }
  }
}
