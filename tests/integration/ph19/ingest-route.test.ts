declare const jest: typeof import('@jest/globals').jest;
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';

jest.mock('@/lib/supabase/request', () => ({ requestClient: jest.fn() }));
jest.mock('@/server/finance/providers', () => ({ extractWithFallback: jest.fn() }));
import { extractWithFallback } from '@/server/finance/providers';
const mockGetUser = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockRpc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockSelect = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const factory = jest.mocked(requestClient);
const mockExtract = jest.mocked(extractWithFallback);

import { POST } from '@/app/api/finance/ingest/route';

const cycleId = '606d7648-12dd-4cfd-8938-ffcc3dcfcf35';
const bucketId = 'ce47746d-11a6-47b8-be80-9476bee47008';
const transactionId = '8d59c6e3-7352-4b61-a8a2-cc08ae8bb917';
function financeResult(revision: string, transaction: string | null = null) {
  return { ok: true, data: { transactionId: transaction, buckets: [
    { id: bucketId, name: 'Dining', allocation: '50000', spent: '0' },
    { id: '2d3154cf-91c5-4b7a-ba5f-4b6582f2f509', name: 'Shopping', allocation: '40000', spent: '0' },
  ], snapshot: {
    schemaVersion: 1, currency: 'INR', revision, cycleId, asOfDate: '2026-10-10', health: 'A', remainingSpendingDays: 1,
    money: { sustainableIncome: '6000000', cycleIncome: null, cash: '250000', unpaidObligations: '50000', accruedCardReserve: '0', goalCycle: '0', goalHeld: '0', discretionaryPool: '200000', spent: '0', marginBudget: '200000', marginLiquid: '200000', safePool: '200000', safeDaily: '200000', safeWeekly: '200000' },
  } } };
}
function cardRecords() { return { ok: true, data: { revision: '1', cycleId, openedOn: '2026-10-10', transactions: [], payments: [], legacy: [] } }; }
function request(body: unknown) {
  return new NextRequest('http://127.0.0.1:3100/api/finance/ingest', { method: 'POST', headers: {
    origin: 'http://127.0.0.1:3100', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
  }, body: JSON.stringify(body) });
}

describe('PH-19 ingestion route boundary', () => {
  beforeEach(() => {
    process.env.PHRON_APP_ORIGIN = 'http://127.0.0.1:3100';
    delete process.env.GEMINI_API_KEY; delete process.env.GROQ_API_KEY;
    mockGetUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-a', is_anonymous: false } }, error: null });
    mockRpc.mockReset().mockImplementation(async (...args: unknown[]) => {
      const name = args[0] as string;
      if (name === 'phron_current_state') return { data: financeResult('1'), error: null };
      if (name === 'phron_card_records') return { data: cardRecords(), error: null };
      if (name === 'phron_ingest_spend') return { data: financeResult('2', transactionId), error: null };
      return { data: null, error: null };
    });
    mockSelect.mockReset().mockResolvedValue({ data: [{ merchant_key: 'Zomato', bucket_id: bucketId }], error: null });
    mockExtract.mockReset().mockResolvedValue({ kind: 'extracted', provider: 'gemini', transactions: [{ amountPaise: '50000', merchantOrPayee: 'Amazon', candidateCategory: 'Shopping & Personal', isEstimated: false, relativeDateOffsetDays: 0 }] });
    factory.mockReturnValue({ client: { auth: { getUser: mockGetUser }, rpc: mockRpc, from: () => ({ select: mockSelect }) }, finish: (response: NextResponse) => response } as unknown as ReturnType<typeof requestClient>);
  });

  it('checks user-scoped exact merchant memory before providers, then saves via the fixed ordinary-user RPC', async () => {
    const response = await POST(request({ text: '₹450 Zomato cash', operationId: 'a1b2c3d4-0000-4000-8000-000000000000', disclosureAccepted: false }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ kind: 'routed', provider: 'local_memory', outcomes: [{ kind: 'committed', confidence: 'HIGH', transactionId }] });
    const mutation = mockRpc.mock.calls.find(([name]) => name === 'phron_ingest_spend');
    expect(mutation?.[1]).toMatchObject({ p_expected_revision: '1', p_input: { amount: '45000', bucketId, paymentMethod: 'cash', confidenceTier: 'HIGH', isEstimated: false } });
    expect(JSON.stringify(mutation?.[1])).not.toContain('user_id');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('requires the approved provider disclosure before an unmapped string can leave the server', async () => {
    const response = await POST(request({ text: '450 Starbucks cash', operationId: 'a1b2c3d4-0000-4000-8000-000000000000', disclosureAccepted: false }));
    expect(await response.json()).toMatchObject({ kind: 'disclosure_required', version: 'D08-v1' });
    expect(mockRpc.mock.calls.some(([name]) => name === 'phron_ingest_spend')).toBe(false);
  });

  it('does not default an exact-memory hit with missing payment method to cash', async () => {
    const response = await POST(request({ text: '₹450 Zomato', operationId: 'a1b2c3d4-0000-4000-8000-000000000000', disclosureAccepted: false }));
    expect(await response.json()).toMatchObject({ kind: 'routed', outcomes: [{ kind: 'method_confirmation' }] });
    expect(mockExtract).not.toHaveBeenCalled();
    expect(mockRpc.mock.calls.some(([name]) => name === 'phron_ingest_spend')).toBe(false);
  });

  it('routes a multi-category merchant at medium confidence and returns the database swap expiry', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    mockRpc.mockImplementation(async (...args: unknown[]) => {
      const name = args[0] as string;
      if (name === 'phron_current_state') return { data: financeResult('1'), error: null };
      if (name === 'phron_card_records') return { data: cardRecords(), error: null };
      if (name === 'phron_ingest_spend') return { data: { ...financeResult('2', transactionId), categorySwapExpiresAt: '2026-10-11T00:00:00.000Z' }, error: null };
      return { data: null, error: null };
    });
    const response = await POST(request({ text: 'Amazon 500 cash', operationId: 'a1b2c3d4-0000-4000-8000-000000000000', disclosureAccepted: true }));
    expect(await response.json()).toMatchObject({ kind: 'routed', outcomes: [{ kind: 'committed', confidence: 'MEDIUM', categorySwapAvailable: true, categorySwapExpiresAt: '2026-10-11T00:00:00.000Z' }] });
    expect(mockRpc.mock.calls.find(([name]) => name === 'phron_ingest_spend')?.[1]).toMatchObject({ p_input: { confidenceTier: 'MEDIUM', paymentMethod: 'cash' } });
  });

  it('rejects unauthenticated users before reading merchant memory', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('not signed in') });
    const response = await POST(request({ text: '450 Zomato cash', operationId: 'a1b2c3d4-0000-4000-8000-000000000000', disclosureAccepted: true }));
    expect(response.status).toBe(401);
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
