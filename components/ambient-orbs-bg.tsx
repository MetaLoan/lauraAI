'use client';

import React, { useEffect, useRef, useState } from 'react';

type OrbConfig = {
  sizeVmax: number;
  color: string;
  blurPx: number;
  opacity: number;
};

const ORBS: OrbConfig[] = [
  { sizeVmax: 52, color: 'rgba(168, 85, 247, 1)', blurPx: 130, opacity: 0.5 }, // purple
  { sizeVmax: 46, color: 'rgba(250, 204, 21, 1)', blurPx: 120, opacity: 0.4 }, // yellow
  { sizeVmax: 50, color: 'rgba(59, 130, 246, 1)', blurPx: 130, opacity: 0.46 },  // blue
];

const ORBS_SAFARI: OrbConfig[] = [
  { sizeVmax: 44, color: 'rgba(168, 85, 247, 1)', blurPx: 76, opacity: 0.34 },
  { sizeVmax: 40, color: 'rgba(250, 204, 21, 1)', blurPx: 70, opacity: 0.28 },
  { sizeVmax: 42, color: 'rgba(59, 130, 246, 1)', blurPx: 76, opacity: 0.32 },
];

type OrbState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  nextRetargetAt: number;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function AmbientOrbsBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua);
    setIsSafari(safari);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const orbConfig = isSafari ? ORBS_SAFARI : ORBS;

    let raf = 0;
    let lastFrameTs = 0;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const getRandomPos = (size: number) => ({
      // allow slight overflow outside container for a softer edge
      x: rand(-size * 0.25, width - size * 0.75),
      y: rand(-size * 0.25, height - size * 0.75),
    });

    const states: OrbState[] = orbConfig.map((orb) => {
      const size = (Math.min(width, height) * orb.sizeVmax) / 100;
      const start = getRandomPos(size);
      const target = getRandomPos(size);
      return {
        x: start.x,
        y: start.y,
        tx: target.x,
        ty: target.y,
        size,
        nextRetargetAt: performance.now() + rand(10000, 18000),
      };
    });

    const applyResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      states.forEach((s, i) => {
        s.size = (Math.min(width, height) * orbConfig[i].sizeVmax) / 100;
      });
    };

    const tick = (now: number) => {
      if (isSafari && now - lastFrameTs < 33) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastFrameTs = now;

      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        const el = orbRefs.current[i];
        if (!el) continue;

        if (now >= s.nextRetargetAt) {
          const target = getRandomPos(s.size);
          s.tx = target.x;
          s.ty = target.y;
          s.nextRetargetAt = now + rand(10000, 18000);
        }

        // very slow lerp movement
        s.x += (s.tx - s.x) * (isSafari ? 0.0022 : 0.0035);
        s.y += (s.ty - s.y) * (isSafari ? 0.0022 : 0.0035);

        el.style.width = `${s.size}px`;
        el.style.height = `${s.size}px`;
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    const onResize = () => applyResize();
    window.addEventListener('resize', onResize, { passive: true });
    applyResize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [isSafari]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden
    >
      {(isSafari ? ORBS_SAFARI : ORBS).map((orb, i) => (
        <div
          key={i}
          ref={(el) => {
            orbRefs.current[i] = el;
          }}
          className={`absolute rounded-full will-change-transform ${isSafari ? '' : 'mix-blend-screen'}`}
          style={{
            left: 0,
            top: 0,
            background: orb.color,
            opacity: orb.opacity,
            filter: `blur(${orb.blurPx}px)`,
          }}
        />
      ))}
    </div>
  );
}
