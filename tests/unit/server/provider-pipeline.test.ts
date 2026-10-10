import { describe, expect, it, jest } from '@jest/globals';
import { extractWithFallback } from '@/server/finance/providers';
import corpus from '@/../tests/fixtures/ph19/corpus.json';

const answer = JSON.stringify({ transactions: [{ amount: '5.00', merchant_or_payee: 'Uber', candidate_category: 'Transit & Commute', is_estimated: false, relative_date_offset_days: 0 }] });
const geminiPayload = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });
const groqPayload = (text: string) => ({ choices: [{ message: { content: text } }] });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('PH-19 provider extraction with mocked transport', () => {
  it('uses Gemini first with the pinned model, schema and bounded output', async () => {
    const fetcher = jest.fn<typeof fetch>().mockResolvedValue(response(geminiPayload(answer)));
    const result = await extractWithFallback('Uber 5', { geminiApiKey: 'test-only', groqApiKey: 'test-only', fetcher });
    expect(result).toMatchObject({ kind: 'extracted', provider: 'gemini', transactions: [{ amountPaise: '500' }] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain('/models/gemini-2.5-flash:generateContent');
    expect(JSON.parse(String(init?.body))).toMatchObject({ generationConfig: { temperature: 0.1, maxOutputTokens: 300, responseMimeType: 'application/json' } });
    expect(JSON.stringify(JSON.parse(String(init?.body)))).not.toMatch(/monthly_net_income|liquid_cash|total_debt/i);
  });

  it('aborts a slow Gemini call and fails over to Groq', async () => {
    const fetcher = jest.fn<typeof fetch>()
      .mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))))
      .mockResolvedValueOnce(response(groqPayload(answer)));
    const result = await extractWithFallback('Uber 5', { geminiApiKey: 'test-only', groqApiKey: 'test-only', fetcher });
    expect(result).toMatchObject({ kind: 'extracted', provider: 'groq' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  }, 10000);

  it('retries malformed Gemini JSON once at zero temperature before failing over', async () => {
    const fetcher = jest.fn<typeof fetch>().mockResolvedValueOnce(response(geminiPayload('{')))
      .mockResolvedValueOnce(response(geminiPayload('{'))).mockResolvedValueOnce(response(groqPayload(answer)));
    const result = await extractWithFallback('Uber 5', { geminiApiKey: 'test-only', groqApiKey: 'test-only', fetcher });
    expect(result).toMatchObject({ kind: 'extracted', provider: 'groq' });
    expect(JSON.parse(String(fetcher.mock.calls[1]![1]?.body)).generationConfig.temperature).toBe(0);
  });

  it('returns manual fallback immediately on provider rate limiting', async () => {
    const fetcher = jest.fn<typeof fetch>().mockResolvedValue(response({}, 429));
    expect(await extractWithFallback('Uber 5', { geminiApiKey: 'test-only', groqApiKey: 'test-only', fetcher })).toEqual({ kind: 'manual_fallback', reason: 'rate_limited' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('never calls a provider if keys are absent and returns manual fallback', async () => {
    const fetcher = jest.fn<typeof fetch>();
    expect(await extractWithFallback('Uber 5', { fetcher })).toEqual({ kind: 'manual_fallback', reason: 'provider_unavailable' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('runs every synthetic corpus case through the mocked provider and strict server validator', async () => {
    for (const item of corpus) {
      const fetcher = jest.fn<typeof fetch>().mockResolvedValue(response(geminiPayload(answer)));
      const result = await extractWithFallback(item.text, { geminiApiKey: 'test-only', fetcher });
      expect(result.kind).toBe('extracted');
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
});
