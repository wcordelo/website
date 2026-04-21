import type { ReactNode } from 'react';
import { CursorBlob } from '../components/CursorBlob';
import { Footer } from '../components/Footer';
import { Nav } from '../components/Nav';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { TweaksPanel } from './TweaksPanel';

export function Chrome({ children }: { children: ReactNode }) {
  useRevealOnScroll();
  return (
    <>
      <CursorBlob />
      <div className="noise" />
      <Nav />
      <div className="page-wrap">{children}</div>
      <Footer />
      <TweaksPanel />
    </>
  );
}
