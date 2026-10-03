import type { ReactNode } from 'react';
import { CursorBlob } from '../components/CursorBlob';
import { Footer } from '../components/Footer';
import { Nav } from '../components/Nav';
import { usePageScroll } from '../hooks/usePageScroll';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { TweaksPanel } from './TweaksPanel';

export function Chrome({ children }: { children: ReactNode }) {
  useRevealOnScroll();
  usePageScroll();
  return (
    <>
      <CursorBlob />
      <div className="noise" />
      <Nav />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main className="page-wrap" id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
      <TweaksPanel />
    </>
  );
}
