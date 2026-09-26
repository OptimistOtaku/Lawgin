import { describe, it, expect } from 'vitest';
import { GeminiService } from '../services/geminiService';

describe('ContractComparator - Difference & Redline Analysis', () => {
  it('should compare two contracts and classify unfavorable differences', async () => {
    const textA = 'Either party may terminate upon thirty (30) days written notice without penalty.';
    const textB = 'Agreement auto-renews unless written notice is received 60 days prior. Early termination fee applies.';

    const result = await GeminiService.compareContracts('Fair Model', textA, 'Client Draft', textB);

    expect(result.docAName).toBe('Fair Model');
    expect(result.docBName).toBe('Client Draft');
    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.diffs.some(d => d.impactVerdict === 'unfavorable')).toBe(true);
  }, 15000);
});
