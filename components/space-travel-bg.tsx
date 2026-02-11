'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Traveling through space - canvas starfield warp effect.
 * Ported from space.md (vanilla JS) to React.
 */
export function SpaceTravelBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const flr = Math.floor;
    let halfw = canvas.width / 2;
    let halfh = canvas.height / 2;
    const warpZ = 12;
    let speed = 0.025;

    function rnd(num1: number, num2: number) {
      return flr(Math.random() * num2 * 2) + num1;
    }
    function getColor() {
      return `hsla(200, 100%, ${rnd(50, 100)}%, 1)`;
    }

    type Vec3 = { x: number; y: number; z: number };
    function add(a: Vec3, b: Vec3): Vec3 {
      return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    }

    class Star {
      v: Vec3;
      color: string;
      calcVel = (): Vec3 => ({ x: 0, y: 0, z: -speed });

      constructor() {
        this.v = {
          x: rnd(-halfw, halfw),
          y: rnd(-halfh, halfh),
          z: rnd(1, warpZ),
        };
        this.color = getColor();
      }

      reset() {
        this.v = {
          x: rnd(-halfw, halfw),
          y: rnd(-halfh, halfh),
          z: rnd(1, warpZ),
        };
        this.color = getColor();
      }

      draw(ctx: CanvasRenderingContext2D) {
        const vel = this.calcVel();
        this.v = add(this.v, vel);
        const { x: vx, y: vy, z: vz } = this.v;
        const x = vx / vz;
        const y = vy / vz;
        const x2 = vx / (vz + speed * 0.5);
        const y2 = vy / (vz + speed * 0.5);

        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (x < -halfw || x > halfw || y < -halfh || y > halfh) {
          this.reset();
        }
      }
    }

    const numOfStars = 250;
    const stars: Star[] = [];
    for (let i = 0; i < numOfStars; i++) {
      stars.push(new Star());
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let rafId: number;
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(halfw, halfh);
      for (let i = 0; i < stars.length; i++) {
        stars[i].draw(ctx);
      }
      rafId = window.requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      halfw = canvas.width / 2;
      halfh = canvas.height / 2;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    width={1920}
    height={1080}
      aria-hidden
    />
  );
}
