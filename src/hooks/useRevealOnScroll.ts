import { useEffect } from 'react';

/**
 * Observes `[data-reveal]` inside `.page-wrap` on mount and whenever the subtree
 * changes (e.g. client-side filter swaps cards) so new nodes still receive `.in`.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const wrap = document.querySelector('.page-wrap');
    if (!wrap) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' },
    );

    const hookUp = () => {
      wrap.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
        io.observe(el);
      });
    };

    let raf = 0;
    const scheduleHookUp = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        hookUp();
      });
    };

    hookUp();

    const mo = new MutationObserver(() => {
      scheduleHookUp();
    });
    mo.observe(wrap, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
