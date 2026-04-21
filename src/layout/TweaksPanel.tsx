import { useEffect, useState } from 'react';
import type { PortfolioTweaks } from '../hooks/useTweaks';
import { useTweaks } from '../hooks/useTweaks';

type RowDef = {
  key: keyof PortfolioTweaks;
  label: string;
  options: [PortfolioTweaks[keyof PortfolioTweaks], string][];
};

const rows: RowDef[] = [
  {
    key: 'theme',
    label: 'Color',
    options: [
      ['ink', 'Ink & Flame'],
      ['deep-space', 'Deep Space'],
      ['plasma', 'Plasma'],
    ],
  },
  {
    key: 'type',
    label: 'Typography',
    options: [
      ['editorial', 'Editorial'],
      ['mono', 'Mono'],
      ['swiss', 'Swiss'],
    ],
  },
  {
    key: 'density',
    label: 'Density',
    options: [
      ['tight', 'Tight'],
      ['normal', 'Normal'],
      ['loose', 'Loose'],
    ],
  },
  {
    key: 'heroVariant',
    label: 'Hero',
    options: [
      ['type', 'Type'],
      ['orbit', 'Orbit'],
      ['terminal', 'Terminal'],
    ],
  },
  {
    key: 'sectionOrder',
    label: 'Section Order',
    options: [
      ['default', 'Default'],
      ['work-first', 'Work First'],
      ['skills-first', 'Skills First'],
    ],
  },
];

export function TweaksPanel() {
  const [tweaks, update] = useTweaks();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__activate_edit_mode') setOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="tweaks open">
      <div className="tweaks-header">
        <span className="tweaks-title">Tweaks</span>
        <button type="button" className="tweak-btn" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>
      {rows.map((row) => (
        <div className="tweaks-row" key={row.key}>
          <h5>{row.label}</h5>
          <div className="tweaks-options">
            {row.options.map(([v, label]) => (
              <button
                key={String(v)}
                type="button"
                className="tweak-btn"
                data-active={tweaks[row.key] === v ? '' : undefined}
                onClick={() => update({ [row.key]: v } as Partial<PortfolioTweaks>)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
