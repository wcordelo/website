import { useCallback, useEffect, useState } from 'react';

export type PortfolioTweaks = {
  theme: 'ink' | 'deep-space' | 'plasma';
  type: 'editorial' | 'mono' | 'swiss';
  density: 'tight' | 'normal' | 'loose';
  heroVariant: 'type' | 'orbit' | 'terminal';
  sectionOrder: 'default' | 'work-first' | 'skills-first';
};

const TWEAK_DEFAULTS: PortfolioTweaks = {
  theme: 'ink',
  type: 'editorial',
  density: 'normal',
  heroVariant: 'orbit',
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

export function useTweaks(): [PortfolioTweaks, (patch: Partial<PortfolioTweaks>) => void] {
  const [tweaks, setTweaks] = useState<PortfolioTweaks>(() => {
    try {
      const saved = localStorage.getItem('portfolio-tweaks');
      return saved ? { ...TWEAK_DEFAULTS, ...JSON.parse(saved) } : { ...TWEAK_DEFAULTS };
    } catch {
      return { ...TWEAK_DEFAULTS };
    }
  });

  useEffect(() => {
    applyTweaks(tweaks);
    try {
      localStorage.setItem('portfolio-tweaks', JSON.stringify(tweaks));
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
