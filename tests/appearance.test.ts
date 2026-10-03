import { afterEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTweaks, type PortfolioTweaks } from '../src/hooks/useTweaks';

const boot = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)![1];
const originalStorage = globalThis.localStorage;
afterEach(() => { globalThis.localStorage = originalStorage; });

function readAppearance(value: string | null, blocked = false) {
  const storage = {
    getItem: () => { if (blocked) throw new Error('Storage blocked'); return value; },
    setItem: (_key: string, next: string) => { value = next; },
  };
  globalThis.localStorage = storage as unknown as Storage;
  let result: PortfolioTweaks | undefined;
  function Profile() {
    [result] = useTweaks();
    return null;
  }
  renderToStaticMarkup(createElement(Profile));
  const root = { dataset: { theme: 'revolut' } as Record<string, string>, removeAttribute: (name: string) => { delete root.dataset[name.replace('data-', '')]; } };
  runInNewContext(boot, { localStorage: storage, document: { documentElement: root } });
  return { result: result!, root: root.dataset, saved: value };
}

describe('returning visitor appearance', () => {
  test('old automatic defaults migrate while typography and density survive', () => {
    const { result, root, saved } = readAppearance(JSON.stringify({ theme: 'ink', heroVariant: 'orbit', type: 'mono', density: 'tight', sectionOrder: 'work-first' }));
    expect(result.theme).toBe('revolut');
    expect(result.heroVariant).toBe('revolut');
    expect(result.type).toBe('mono');
    expect(result.density).toBe('tight');
    expect(result.sectionOrder).toBe('work-first');
    expect(root.theme).toBe(result.theme);
    expect(JSON.parse(saved!).version).toBe(2);
  });
  test.each(['deep-space', 'plasma'] as const)('custom %s choice applies before paint and survives hydration', (theme) => {
    const { result, root } = readAppearance(JSON.stringify({ theme, heroVariant: 'terminal', type: 'swiss' }));
    expect(result.theme).toBe(theme);
    expect(result.heroVariant).toBe('terminal');
    expect(root.theme).toBe(theme);
    expect(root.type).toBe('swiss');
  });
  test('a versioned choice of the former appearance is respected', () => {
    const { result, root } = readAppearance(JSON.stringify({ theme: 'ink', heroVariant: 'orbit', version: 2 }));
    expect(result.theme).toBe('ink');
    expect(result.heroVariant).toBe('orbit');
    expect(root.theme).toBeUndefined();
  });
  test.each([null, '{bad json', 'null'])('unavailable or corrupt preferences use the refreshed defaults: %s', (value) => {
    const { result, root } = readAppearance(value);
    expect(result.theme).toBe('revolut');
    expect(result.heroVariant).toBe('revolut');
    expect(root.theme).toBe(result.theme);
  });
  test('blocked storage does not prevent rendering', () => {
    expect(readAppearance(null, true).result.theme).toBe('revolut');
  });
});
