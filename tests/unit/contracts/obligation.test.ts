import { describe, expect, it } from '@jest/globals';
import { parseObligationPayment } from '@/contracts/obligation';

const id = '11111111-1111-4111-8111-111111111111';
const envelope = (input: unknown) => ({ operationId: id, expectedVersion: '0', input });
const valid = { cycleObligationId: id, amount: '101', paymentDate: '2026-10-10' };

describe('obligation payment transport contract', () => {
  it('preserves exact positive integer-paise strings and normalizes UUID case', () => {
    expect(parseObligationPayment(envelope({ ...valid, cycleObligationId: id.toUpperCase(), amount: '9007199254740993' }))).toEqual({
      operationId: id, expectedVersion: '0', input: { ...valid, amount: '9007199254740993' },
    });
  });

  it.each([null, [], 'not an object'])('rejects a non-object payment input: %p', (input) => {
    expect(() => parseObligationPayment(envelope(input))).toThrow();
  });

  it.each([
    {},
    { ...valid, user_id: 'forged' },
    { ...valid, cycleObligationId: 'not-a-uuid' },
    { ...valid, amount: 1 },
    { ...valid, amount: '0' },
    { ...valid, amount: '-1' },
    { ...valid, amount: '1.5' },
    { ...valid, amount: '9223372036854775808' },
    { ...valid, paymentDate: '2026-02-30' },
  ])('rejects malformed or non-positive payment values: %p', (input) => {
    expect(() => parseObligationPayment(envelope(input))).toThrow();
  });

  it('rejects invalid envelope shapes before accepting its nested input', () => {
    for (const value of [null, [], { ...envelope(valid), extra: true }, { operationId: id, expectedVersion: '0' }]) {
      expect(() => parseObligationPayment(value)).toThrow();
    }
  });
});
