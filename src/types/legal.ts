export type PersonaType = 'layman' | 'tenant' | 'freelancer' | 'consumer' | 'business';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Clause {
  id: string;
  number: string;
  title: string;
  originalText: string;
  simplifiedText?: string;
  riskLevel: RiskLevel;
  riskExplanation?: string;
  suggestedAlternative?: string;
  category: 'payment' | 'liability' | 'termination' | 'ip' | 'dispute' | 'privacy' | 'general';
  isPredatory?: boolean;
  predatoryReason?: string;
}

export interface RiskCategoryBreakdown {
  category: string;
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  clauseCount: number;
  highlight: string;
}

export interface DocumentAnalysis {
  id: string;
  title: string;
  documentType: 'lease' | 'freelance_msa' | 'terms_of_service' | 'employment' | 'custom';
  readingGradeLevel: string; // e.g. "College Graduate (Grade 16)" -> "8th Grade"
  readingTimeMinutes: number;
  overallRiskScore: number; // 0 to 100 (100 = dangerous)
  overallRiskVerdict: 'Safe & Balanced' | 'Moderate Caution' | 'High Risk / Unfavorable' | 'Critical Red Flags';
  executiveSummary: string;
  plainEnglishSummary: string;
  keyObligations: string[];
  keyRights: string[];
  clauses: Clause[];
  categoryBreakdown: RiskCategoryBreakdown[];
  predatoryTrapsCount: number;
}

export interface ComparisonDiffItem {
  id: string;
  category: string;
  docAClauseTitle: string;
  docAClauseText: string;
  docBClauseTitle: string;
  docBClauseText: string;
  impactVerdict: 'favorable' | 'unfavorable' | 'neutral' | 'added' | 'removed';
  explanation: string;
  recommendation: string;
}

export interface ComparisonResult {
  docAName: string;
  docBName: string;
  summaryVerdict: string;
  favorableChangesCount: number;
  unfavorableChangesCount: number;
  neutralChangesCount: number;
  diffs: ComparisonDiffItem[];
}

export interface QACitation {
  clauseId: string;
  clauseNumber: string;
  clauseTitle: string;
  snippet: string;
}

export interface QAMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  citations?: QACitation[];
  suggestedFollowUps?: string[];
  confidenceScore?: number; // e.g. 96%
}

export interface ScenarioSimulationResult {
  scenarioQuery: string;
  contractVerdict: string;
  allowed: boolean | 'conditional';
  directClausesInvolved: string[];
  financialConsequences: string;
  legalRisks: string;
  stepByStepActionPlan: string[];
  safeAlternativeAdvice: string;
}

export interface ComplianceChecklistItem {
  id: string;
  dueDateOrTrigger: string;
  title: string;
  description: string;
  responsibleParty: 'You' | 'Counterparty' | 'Mutual';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  clauseRef?: string;
}

export interface LawyerIntakeDossier {
  documentTitle: string;
  userRole: string;
  summaryOfEngagement: string;
  primaryGoals: string[];
  redFlagClauses: {
    clauseNumber: string;
    title: string;
    riskReason: string;
    desiredOutcome: string;
  }[];
  unresolvedAmbiguities: string[];
  targetQuestionsForAttorney: string[];
  estimatedReviewFocus: string;
}

export interface RedlineCounterProposal {
  recipientName: string;
  subjectLine: string;
  emailBody: string;
  proposedModifications: {
    clauseNumber: string;
    clauseTitle: string;
    originalLanguage: string;
    proposedLanguage: string;
    businessJustification: string;
  }[];
}

export interface PIIShieldDetection {
  original: string;
  placeholder: string;
  type: 'NAME' | 'EMAIL' | 'PHONE' | 'SSN' | 'ADDRESS' | 'FINANCIAL';
}

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  dyslexiaFont: boolean;
  highContrast: boolean;
  ttsEnabled: boolean;
  speechRate: number; // 0.8 - 1.2
}
