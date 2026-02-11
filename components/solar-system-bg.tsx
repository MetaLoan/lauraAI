'use client';

import React from 'react';

/**
 * Solar system orbit background - true time scaled (1 Earth year = 30s).
 * Malik Dellidj - @Dathink style, used as landing page background.
 */
export function SolarSystemBg() {
  return (
    <div
      className="solar-syst"
      style={{
        /* 全屏铺满：用 vmax 让最外圈轨道撑满视口 */
        transform: 'translate(-50%, -50%) scale(2.2)',
        maxWidth: '300vmax',
        maxHeight: '300vmax',
      }}
      aria-hidden
    >
      <div className="sun" />
      <div className="mercury" />
      <div className="venus" />
      <div className="earth" />
      <div className="mars" />
      <div className="jupiter" />
      <div className="saturn" />
      <div className="uranus" />
      <div className="neptune" />
      <div className="asteroids-belt" />
      <div className="pluto" />
    </div>
  );
}
