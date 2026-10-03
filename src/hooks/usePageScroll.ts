import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map<string, number>();

function getHashTarget(hash: string): HTMLElement | null {
  if (!hash) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function scrollToHashTarget(hash: string) {
  const target = getHashTarget(hash);
  if (!target) return;
  target.classList.add('in');
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export function usePageScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || !url.hash) return;
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (destination !== current) return;
      event.preventDefault();
      scrollToHashTarget(url.hash);
      const target = getHashTarget(url.hash);
      target?.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname, location.search, location.hash]);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const headerHeight = document.querySelector('.nav')?.getBoundingClientRect().height ?? 64;
    document.documentElement.style.setProperty('--anchor-offset', `${headerHeight + 16}px`);

    const entry = `${location.key}:${location.pathname}${location.hash}`;
    const restoredPosition = navigationType === 'POP' ? positions.get(entry) : undefined;
    const target = getHashTarget(location.hash);

    const move = () => {
      if (restoredPosition !== undefined) {
        window.scrollTo({ top: restoredPosition, behavior: 'instant' });
      } else if (target) {
        scrollToHashTarget(location.hash);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    let interrupted = false;
    move();
    if (navigationType !== 'POP') {
      const focusTarget = target ?? document.getElementById('main-content');
      focusTarget?.setAttribute('tabindex', '-1');
      focusTarget?.focus({ preventScroll: true });
    }
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
