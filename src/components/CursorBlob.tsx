import { useEffect, useRef } from 'react';

export function CursorBlob() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    const handle = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener('mousemove', handle);
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y - pos.y) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      window.removeEventListener('mousemove', handle);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="cursor-blob" ref={ref} />;
}
