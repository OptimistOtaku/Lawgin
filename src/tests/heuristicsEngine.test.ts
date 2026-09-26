import { describe, it, expect } from 'vitest';
import { HeuristicsEngine } from '../services/heuristicsEngine';

describe('HeuristicsEngine - Legal Intelligence & Trap Detection', () => {
  it('should segment a document into clauses by headers', () => {
    const raw = `SECTION 1. TERM
The term shall be 12 months.

SECTION 2. RENT
Monthly rent is $2,000.`;

    const clauses = HeuristicsEngine.segmentDocument(raw);
    expect(clauses.length).toBe(2);
    expect(clauses[0].number).toBe('1');
    expect(clauses[0].title).toBe('TERM');
    expect(clauses[1].number).toBe('2');
    expect(clauses[1].title).toBe('RENT');
  });

  it('should detect predatory uncapped indemnification clauses', () => {
    const title = 'Indemnification';
    const text = 'Contractor shall defend and hold harmless Client from any and all claims without limitation.';
    const result = HeuristicsEngine.analyzeClauseRisk(title, text);

    expect(result.riskLevel).toBe('critical');
    expect(result.isPredatory).toBe(true);
    expect(result.category).toBe('liability');
    expect(result.alternative).toBeDefined();
  });

  it('should detect mandatory arbitration and class action surrender', () => {
    const title = 'Dispute Resolution';
    const text = 'All claims must be submitted to confidential binding arbitration and you waive the right to participate in a class action.';
    const result = HeuristicsEngine.analyzeClauseRisk(title, text);

    expect(result.riskLevel).toBe('high');
    expect(result.isPredatory).toBe(true);
    expect(result.category).toBe('dispute');
  });

  it('should detect sneaky auto-renewal lock-in clauses', () => {
    const title = 'Renewal';
    const text = 'Agreement will automatically renew unless 60 days prior written notice is given.';
    const result = HeuristicsEngine.analyzeClauseRisk(title, text);

    expect(result.riskLevel).toBe('high');
    expect(result.isPredatory).toBe(true);
    expect(result.category).toBe('termination');
  });

  it('should calculate Flesch-Kincaid readability metrics', () => {
    const simple = 'The cat sat on the mat. It was a good day.';
    const complex = 'Notwithstanding anything contained herein to the contrary, the indemnifying party shall unconditionally defend, hold harmless, and indemnify.';

    const simpleRes = HeuristicsEngine.calculateReadability(simple);
    const complexRes = HeuristicsEngine.calculateReadability(complex);

    expect(simpleRes.score).toBeGreaterThan(complexRes.score);
  });

  it('should perform a full document risk assessment calculation', () => {
    const raw = `SECTION 1. INDEMNITY
Contractor shall defend and hold harmless Client without limitation for any and all claims.

SECTION 2. DISPUTE
All disputes shall be resolved by binding arbitration and class action waiver.`;

    const analysis = HeuristicsEngine.performFullAnalysis('Test Contract', raw, 'freelance_msa');
    expect(analysis.overallRiskScore).toBeGreaterThan(50);
    expect(analysis.predatoryTrapsCount).toBeGreaterThanOrEqual(1);
    expect(analysis.clauses.length).toBe(2);
  });
});
