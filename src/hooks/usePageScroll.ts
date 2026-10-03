import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map<string, number>();

export function usePageScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const headerHeight = document.querySelector('.nav')?.getBoundingClientRect().height ?? 64;
    document.documentElement.style.setProperty('--anchor-offset', `${headerHeight + 16}px`);

    const entry = `${location.key}:${location.pathname}${location.hash}`;
    const restoredPosition = navigationType === 'POP' ? positions.get(entry) : undefined;
    let target: HTMLElement | null = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {
      // Malformed hashes should still allow page navigation.
    }

    const move = () => {
      if (restoredPosition !== undefined) {
        window.scrollTo({ top: restoredPosition, behavior: 'instant' });
      } else if (target) {
        target.classList.add('in');
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    let interrupted = false;
    move();
    const frame = requestAnimationFrame(() => {
      if (!interrupted) move();
    });
    const interrupt = () => { interrupted = true; };
    const inputEvents = ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const;
    inputEvents.forEach((event) => window.addEventListener(event, interrupt, { passive: true }));
    void document.fonts.ready.then(() => {
      if (!interrupted) move();
    });

    const save = () => {
      positions.set(entry, window.scrollY);
      if (positions.size > 100) positions.delete(positions.keys().next().value!);
    };
    save();
    window.addEventListener('scroll', save, { passive: true });

    return () => {
      interrupted = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', save);
      inputEvents.forEach((event) => window.removeEventListener(event, interrupt));
      window.history.scrollRestoration = previousRestoration;
    };
  }, [location.key, location.pathname, location.hash, navigationType]);
}
