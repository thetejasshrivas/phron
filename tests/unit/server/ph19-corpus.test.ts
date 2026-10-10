import { describe, expect, it } from '@jest/globals';
import corpus from '@/../tests/fixtures/ph19/corpus.json';

describe('PH-19 synthetic corpus inventory', () => {
  it('contains exactly 50 unique, bounded capture strings in the required partitions', () => {
    expect(corpus).toHaveLength(50);
    expect(new Set(corpus.map((item) => item.id)).size).toBe(50);
    expect(corpus.every((item) => Array.from(item.text).length <= 280)).toBe(true);
    expect(corpus.reduce<Record<string, number>>((groups, item) => {
      groups[item.group] = (groups[item.group] ?? 0) + 1;
      return groups;
    }, {})).toEqual({ simple: 10, hinglish_multi: 10, estimate: 6, multi_category: 6, p2p_clarification: 5, relative_date: 5, card_method: 4, hostile: 4 });
  });
});
