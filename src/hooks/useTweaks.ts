import { useCallback, useLayoutEffect, useState } from 'react';

export type PortfolioTweaks = {
  theme: 'ink' | 'deep-space' | 'plasma' | 'revolut';
  type: 'editorial' | 'mono' | 'swiss';
  density: 'tight' | 'normal' | 'loose';
  heroVariant: 'type' | 'orbit' | 'terminal' | 'revolut';
  sectionOrder: 'default' | 'work-first' | 'skills-first';
};

const TWEAK_DEFAULTS: PortfolioTweaks = {
  theme: 'revolut',
  type: 'editorial',
  density: 'normal',
  heroVariant: 'revolut',
  sectionOrder: 'default',
};

function applyTweaks(t: PortfolioTweaks) {
  const root = document.documentElement;
  if (t.theme === 'ink') root.removeAttribute('data-theme');
  else root.dataset.theme = t.theme;
  if (t.type === 'editorial') root.removeAttribute('data-type');
  else root.dataset.type = t.type;
  root.dataset.density = t.density;
  root.dataset.heroVariant = t.heroVariant;
  root.dataset.sectionOrder = t.sectionOrder;
}

export function readStoredTweaks(): PortfolioTweaks {
    try {
      const saved = localStorage.getItem('portfolio-tweaks');
      const parsed = saved ? JSON.parse(saved) : {};
      const next = { ...TWEAK_DEFAULTS, ...parsed };
      if (parsed.version !== 2 && next.theme === 'ink' && next.heroVariant === 'orbit') {
        next.theme = TWEAK_DEFAULTS.theme;
        next.heroVariant = TWEAK_DEFAULTS.heroVariant;
      }
      return next;
    } catch {
      return { ...TWEAK_DEFAULTS };
    }
}

export function useTweaks(): [PortfolioTweaks, (patch: Partial<PortfolioTweaks>) => void] {
  const [tweaks, setTweaks] = useState<PortfolioTweaks>(TWEAK_DEFAULTS);

  useLayoutEffect(() => {
    const saved = readStoredTweaks();
    applyTweaks(saved);
    setTweaks(saved);
  }, []);

  useLayoutEffect(() => {
    if (tweaks === TWEAK_DEFAULTS) return;
    applyTweaks(tweaks);
    try {
      localStorage.setItem('portfolio-tweaks', JSON.stringify({ ...tweaks, version: 2 }));
    } catch {
      /* ignore */
    }
  }, [tweaks]);

  const update = useCallback((patch: Partial<PortfolioTweaks>) => {
    setTweaks((prev) => {
      const next = { ...prev, ...patch };
      window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
      return next;
    });
  }, []);

  return [tweaks, update];
}
