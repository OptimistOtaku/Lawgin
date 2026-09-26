import React, { useEffect, useRef } from 'react';

interface ClassicalBackdropProps {
  isDark: boolean;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  base: number;
  phase: number;
}

/**
 * ClassicalBackdrop
 * A layered, GPU-friendly "motion graphic" backdrop in the Greek/Roman
 * legal idiom: a receding colonnade, torch-light that tracks the cursor,
 * floating dust motes on canvas, scrolling meander friezes, and a slowly
 * rotating great seal of justice.
 *
 * All layers are decorative (aria-hidden, pointer-events:none) and fully
 * disabled under `prefers-reduced-motion`.
 */
export const ClassicalBackdrop: React.FC<ClassicalBackdropProps> = ({ isDark }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Cursor driven torch light + colonnade parallax ---------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
        root.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
        root.style.setProperty('--parallax', `${((x - 0.5) * -30).toFixed(2)}px`);
        root.style.setProperty('--parallax-y', `${((y - 0.5) * -18).toFixed(2)}px`);
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- Floating dust motes ------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const palette = isDark
      ? ['#e6c666', '#c9a227', '#d4ae3f', '#f4e2a4']
      : ['#8a6a18', '#a9861c', '#b0864a'];

    const count = Math.max(18, Math.min(64, Math.round(width / 26)));
    const motes: Mote[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 2.1,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.08 + Math.random() * 0.34),
      base: 0.1 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    }));

    let t = 0;
    let paused = false;
    const draw = () => {
      if (paused) return;
      t += 0.016;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx + Math.sin(t * 0.6 + m.phase) * 0.09;
        m.y += m.vy;
        if (m.y < -8) {
          m.y = height + 8;
          m.x = Math.random() * width;
        }
        if (m.x < -8) m.x = width + 8;
        if (m.x > width + 8) m.x = -8;

        const twinkle = 0.55 + Math.sin(t * 2 + m.phase) * 0.45;
        ctx.globalAlpha = m.base * twinkle;
        ctx.fillStyle = palette[i % palette.length];
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // Pause the render loop when the tab is hidden to save CPU / battery.
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isDark]);

  // Receding colonnade depths (foreground flanks the viewport)
  const columns = [
    { depth: 0.35, h: '74vh', o: 0.55 },
    { depth: 0.6, h: '82vh', o: 0.7 },
    { depth: 0.95, h: '92vh', o: 0.9 },
    { depth: 1.3, h: '100vh', o: 1 },
    { depth: 0.95, h: '92vh', o: 0.9 },
    { depth: 0.6, h: '82vh', o: 0.7 },
    { depth: 0.35, h: '74vh', o: 0.55 }
  ];

  return (
    <div ref={rootRef} className="backdrop-root no-print" aria-hidden="true">
      {/* Torch light following the cursor */}
      <div className="backdrop-torch" />

      {/* Rotating great seal of justice */}
      <svg className="backdrop-seal" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="94" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="84" strokeWidth="0.7" strokeDasharray="3 6" />
        <circle cx="100" cy="100" r="66" strokeWidth="0.7" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 84}
              y1={100 + Math.sin(a) * 84}
              x2={100 + Math.cos(a) * 94}
              y2={100 + Math.sin(a) * 94}
              strokeWidth="1"
            />
          );
        })}
        {/* Scales of justice */}
        <g strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="100" y1="52" x2="100" y2="132" />
          <line x1="64" y1="66" x2="136" y2="66" />
          <line x1="78" y1="132" x2="122" y2="132" />
          <path d="M52 66 64 92a12 12 0 0 0 24 0L76 66" />
          <path d="M124 66l12 26a12 12 0 0 0 24 0l-12-26" />
        </g>
        {/* Laurel arcs */}
        <g strokeWidth="1.2">
          <path d="M100 158c-16 0-30-8-38-21" />
          <path d="M100 158c16 0 30-8 38-21" />
        </g>
      </svg>

      {/* Colonnade */}
      <div className="backdrop-columns">
        {columns.map((c, i) => (
          <div
            key={i}
            className="backdrop-column"
            style={{
              height: c.h,
              opacity: c.o,
              '--depth': c.depth,
              transform: `translateY(calc(var(--parallax, 0px) * ${c.depth}))`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Drifting dust motes */}
      <canvas ref={canvasRef} className="backdrop-canvas" />

      {/* Scrolling meander friezes */}
      <div className="backdrop-meander top" />
      <div className="backdrop-meander bottom" />

      {/* Marble grain */}
      <div className="backdrop-grain" />
    </div>
  );
};
