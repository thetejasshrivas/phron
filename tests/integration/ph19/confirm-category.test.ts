declare const jest: typeof import('@jest/globals').jest;
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';

jest.mock('@/lib/supabase/request', () => ({ requestClient: jest.fn() }));
const mockGetUser = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockRpc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const factory = jest.mocked(requestClient);
import { POST } from '@/app/api/finance/ingest/confirm-category/route';

const bucketId = 'ce47746d-11a6-47b8-be80-9476bee47008';
const transactionId = '8d59c6e3-7352-4b61-a8a2-cc08ae8bb917';
const operationId = 'a1b2c3d4-0000-4000-8000-000000000000';
const snapshot = { schemaVersion: 1, currency: 'INR', revision: '2', cycleId: '606d7648-12dd-4cfd-8938-ffcc3dcfcf35', asOfDate: '2026-10-10', health: 'A', remainingSpendingDays: 1,
  money: { sustainableIncome: '6000000', cycleIncome: null, cash: '250000', unpaidObligations: '50000', accruedCardReserve: '0', goalCycle: '0', goalHeld: '0', discretionaryPool: '200000', spent: '0', marginBudget: '200000', marginLiquid: '200000', safePool: '200000', safeDaily: '200000', safeWeekly: '200000' } };
const result = { ok: true, data: { transactionId, snapshot, buckets: [{ id: bucketId, name: 'Pet Care', allocation: '50000', spent: '0' }] } };
const valid = { operationId, expectedVersion: '1', input: { amount: '25000', merchantOrPayee: 'Pet Clinic', bucketId, paymentMethod: 'cash', transactionDate: '2026-10-10', rawText: 'Pet Clinic 250 cash', isEstimated: false } };
const request = (body: unknown) => new NextRequest('http://127.0.0.1:3100/api/finance/ingest/confirm-category', { method: 'POST', headers: { origin: 'http://127.0.0.1:3100', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('PH-19 category confirmation boundary', () => {
  beforeEach(() => {
    process.env.PHRON_APP_ORIGIN = 'http://127.0.0.1:3100';
    mockGetUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-a', is_anonymous: false } }, error: null });
    mockRpc.mockReset().mockResolvedValue({ data: result, error: null });
    factory.mockReturnValue({ client: { auth: { getUser: mockGetUser }, rpc: mockRpc }, finish: (response: NextResponse) => response } as unknown as ReturnType<typeof requestClient>);
  });

  it('saves the selected category via the ordinary-user stable-ID RPC', async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, data: { transactionId } });
    expect(mockRpc).toHaveBeenCalledWith('phron_ingest_confirm_category', {
      p_operation_id: operationId, p_expected_revision: '1', p_input: valid.input,
    });
    expect(JSON.stringify(mockRpc.mock.calls[0])).not.toContain('user_id');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects forged, malformed, nonpositive, or stale-schema input before database access', async () => {
    for (const body of [
      { ...valid, userId: 'other' },
      { ...valid, input: { ...valid.input, amount: '1e3' } },
      { ...valid, input: { ...valid.input, amount: '0' } },
      { ...valid, input: { ...valid.input, paymentMethod: 'unknown' } },
    ]) {
      mockRpc.mockClear();
      expect((await POST(request(body))).status).toBe(400);
      expect(mockRpc).not.toHaveBeenCalled();
    }
  });

  it('rejects unauthenticated and cross-origin requests', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('unauthenticated') });
    expect((await POST(request(valid))).status).toBe(401);
    const crossOrigin = new NextRequest('http://127.0.0.1:3100/api/finance/ingest/confirm-category', { method: 'POST', headers: { origin: 'https://evil.test', 'content-type': 'application/json' }, body: JSON.stringify(valid) });
    expect((await POST(crossOrigin)).status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
