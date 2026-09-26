import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiService } from '../services/geminiService';

const modelResponse = (payload: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] })
  }) as unknown as Response;

describe('ContractComparator — difference & redline analysis', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('classifies an unfavorable difference returned by the model', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        modelResponse({
          summaryVerdict: 'Document B is materially less protective.',
          favorableChangesCount: 0,
          unfavorableChangesCount: 1,
          neutralChangesCount: 0,
          diffs: [
            {
              id: 'diff-1',
              category: 'Termination',
              docAClauseTitle: '30-day notice',
              docAClauseText: 'Either party may terminate on 30 days notice.',
              docBClauseTitle: '60-day auto-renewal',
              docBClauseText: 'Agreement auto-renews unless 60 days notice is given.',
              impactVerdict: 'unfavorable',
              explanation: 'Doc B adds an evergreen lock-in.',
              recommendation: 'Restore the 30-day termination right.'
            }
          ]
        })
      )
    );

    const result = await GeminiService.compareContracts('Fair Model', 'A', 'Client Draft', 'B');

    expect(result.docAName).toBe('Fair Model');
    expect(result.docBName).toBe('Client Draft');
    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.diffs.some(d => d.impactVerdict === 'unfavorable')).toBe(true);
  });

  it('falls back to an offline heuristic comparison when the API is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'service unavailable' } })
          }) as unknown as Response
      )
    );

    const result = await GeminiService.compareContracts('Fair Model', 'A', 'Client Draft', 'B');

    expect(result.unfavorableChangesCount).toBeGreaterThan(0);
    expect(result.diffs.length).toBeGreaterThan(0);
  });
});
