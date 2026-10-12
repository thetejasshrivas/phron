import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from '@jest/globals';
import { HomeSurface } from '@/components/home/Home';
import { HomeSession } from '@/client/home-session';

test('primary navigation and privacy-safe microphone fallback are available while loading', () => {
  const html = renderToStaticMarkup(createElement(HomeSurface, {
    view: { data: null, phase: 'loading', notice: 'Loading confirmed records' },
    session: new HomeSession(fetch, () => crypto.randomUUID()),
  }));
  expect(html).toContain('href="/visualize"');
  expect(html).toContain('href="/manage"');
  expect(html).toContain('Microphone: voice or text entry');
  expect(html).toContain('Safe this week');
  expect(html).toMatch(/<input[^>]*id="natural-capture-text"/);
  expect(html.indexOf('id="natural-capture-text"')).toBeLessThan(html.indexOf('id="coach-title"'));
  expect(html.indexOf('id="bucket-section"')).toBeLessThan(html.indexOf('aria-label="Home navigation"'));
});
