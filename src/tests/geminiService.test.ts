import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService, DEFAULT_MODEL, MODEL_FALLBACKS } from '../services/geminiService';

/** Minimal Response double so tests never depend on a real fetch/Response implementation. */
const okJson = (text: string) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] })
  }) as unknown as Response;

const errorResponse = (status: number, message = 'quota exceeded') =>
  ({
    ok: false,
    status,
    json: async () => ({ error: { message } })
  }) as unknown as Response;

describe('GeminiService — configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    vi.stubEnv('VITE_GEMINI_MODEL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults to the verified free model with a free-tier fallback ladder', () => {
    expect(DEFAULT_MODEL).toBe('gemini-3.7-flash');
    expect(GeminiService.getActiveModel()).toBe(DEFAULT_MODEL);
    expect(MODEL_FALLBACKS).toContain('gemini-3.6-flash');
  });

  it('prefers a user-selected model over the default', () => {
    GeminiService.setActiveModel('gemini-3.5-flash');
    expect(GeminiService.getActiveModel()).toBe('gemini-3.5-flash');
  });

  it('reports key availability and supports clearing a stored key', () => {
    expect(GeminiService.hasKey()).toBe(true);
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    GeminiService.setKey('user-key');
    expect(GeminiService.hasKey()).toBe(true);
    GeminiService.clearKey();
    expect(GeminiService.hasKey()).toBe(false);
  });
});

describe('GeminiService — resilience & security', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    vi.stubEnv('VITE_GEMINI_MODEL', 'gemini-3.7-flash');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the key via the x-goog-api-key header, never in the URL', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        capturedUrl = String(url);
        capturedInit = init;
        return okJson('{"summaryVerdict":"ok","diffs":[]}');
      })
    );

    await GeminiService.compareContracts('A', 'a', 'B', 'b');

    expect(capturedUrl).not.toContain('key=');
    expect((capturedInit?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
  });

  it('fails over to the next free model when the primary is rate limited', async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(String(url));
        if (String(url).includes('gemini-3.7-flash')) return errorResponse(429);
        return okJson('{"summaryVerdict":"recovered","diffs":[]}');
      })
    );

    const result = await GeminiService.compareContracts('A', 'a', 'B', 'b');

    expect(urls[0]).toContain('gemini-3.7-flash');
    expect(urls.some(u => u.includes('gemini-3.6-flash'))).toBe(true);
    expect(result.summaryVerdict).toBe('recovered');
  });

  it('parses model JSON even when it is wrapped in markdown fences', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson('```json\n{"summaryVerdict":"fenced","diffs":[]}\n```')));

    const result = await GeminiService.compareContracts('A', 'a', 'B', 'b');
    expect(result.summaryVerdict).toBe('fenced');
  });

  it('degrades gracefully without a key and never touches the network', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    localStorage.clear();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await GeminiService.simulateScenario('late rent', 'contract text', []);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.scenarioQuery).toBe('late rent');
    expect(result.stepByStepActionPlan.length).toBeGreaterThan(0);
  });

  it('falls back to a local comparison when every free model is exhausted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => errorResponse(429)));

    const result = await GeminiService.compareContracts('Fair Model', 'A', 'Client Draft', 'B');

    expect(result.unfavorableChangesCount).toBeGreaterThan(0);
    expect(result.diffs.some(d => d.impactVerdict === 'unfavorable')).toBe(true);
  });
});
