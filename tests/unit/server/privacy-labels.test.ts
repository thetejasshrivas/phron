import { expect, it } from '@jest/globals';
import { hasSensitiveOutboundContext } from '@/server/finance/privacy-firewall';

const labels = ['monthly_net_income', 'liquid_balance', 'current_liquid_balance', 'total_debt', 'debt_obligation', 'user_id', 'email'];
it.each(labels.flatMap(label => [label, label.replaceAll('_', ' '), label.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), label.toUpperCase()]))('keeps protected label %s local', label => {
  expect(hasSensitiveOutboundContext(`${label}: PRIVATE_SENTINEL coffee 1.50 cash`)).toBe(true);
});
it('preserves ordinary merchant text eligibility', () => {
  expect(hasSensitiveOutboundContext('Synthetic Cafe 1.50 cash')).toBe(false);
});
