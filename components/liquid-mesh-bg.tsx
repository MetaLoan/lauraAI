'use client';

import React, { useEffect, useRef } from 'react';

/**
 * 三色渐变背景 — 3 个大模糊圆（紫、玫红、蓝）
 * 物理弹跳：随机速度移动，碰到边缘回弹
 */

const CIRCLES = [
  { size: 1800, color: 'bg-purple-600' },
  { size: 1500, color: 'bg-pink-600' },
  { size: 1650, color: 'bg-blue-600' },
  { size: 1560, color: 'bg-yellow-500' },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function LiquidMeshBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // 每个圆的状态
    const states = CIRCLES.map((c) => ({
      x: rand(0, Math.max(0, w - c.size)),
      y: rand(0, Math.max(0, h - c.size)),
      vx: rand(0.375, 1) * (Math.random() > 0.5 ? 1 : -1),
      vy: rand(0.375, 1) * (Math.random() > 0.5 ? 1 : -1),
      size: c.size,
    }));

    let raf: number;

    function tick() {
      const cw = container!.clientWidth;
      const ch = container!.clientHeight;

      states.forEach((s, i) => {
        s.x += s.vx;
        s.y += s.vy;

        if (s.x <= 0) { s.vx = Math.abs(s.vx); s.x = 0; }
        if (s.y <= 0) { s.vy = Math.abs(s.vy); s.y = 0; }
        if (s.x + s.size >= cw) { s.vx = -Math.abs(s.vx); s.x = cw - s.size; }
        if (s.y + s.size >= ch) { s.vy = -Math.abs(s.vy); s.y = ch - s.size; }

        const el = circleRefs.current[i];
        if (el) {
          el.style.transform = `translate(${s.x}px, ${s.y}px)`;
        }
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 bg-[#080810] overflow-hidden">
      {CIRCLES.map((c, i) => (
        <div
          key={i}
          ref={(el) => { circleRefs.current[i] = el; }}
          className={`absolute rounded-full ${c.color} opacity-40 blur-[200px] will-change-transform`}
          style={{ width: c.size, height: c.size, top: 0, left: 0 }}
        />
      ))}
    </div>
  );
}
