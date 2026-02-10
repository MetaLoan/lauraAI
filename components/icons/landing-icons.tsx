import React from 'react';

// Enhanced Heart Icon - Data Stream Style
export const IconHeartPulse = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="heartGrad" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EC4899" />
                <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow-heart" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path
            d="M24 8.5C21 5.5 16 4 12 4C5.5 4 1 9 1 15.5C1 26 14 36 24 44C34 36 47 26 47 15.5C47 9 42.5 4 36 4C32 4 27 5.5 24 8.5Z"
            stroke="url(#heartGrad)"
            strokeWidth="2"
            fill="url(#heartGrad)"
            fillOpacity="0.1"
            className="drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        />
        <path d="M12 20H16L18 14L22 26L26 18L28 20H36" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Enhanced Shield Icon - Cyber Security Style
export const IconCyberShield = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="shieldGrad" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
        </defs>
        <path
            d="M24 4L6 10V22C6 33 14 42 24 46C34 42 42 33 42 22V10L24 4Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2"
            fill="url(#shieldGrad)"
            fillOpacity="0.1"
            className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
        <path d="M24 16V30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 22H30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="23" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

// Enhanced Wallet Icon - DeFi Chip Style
export const IconDeFiWallet = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="walletGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#34D399" />
            </linearGradient>
        </defs>
        <rect x="4" y="10" width="40" height="28" rx="4" stroke="url(#walletGrad)" strokeWidth="2" fill="url(#walletGrad)" fillOpacity="0.1" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <path d="M34 10V24M34 24V38M34 24H44" stroke="url(#walletGrad)" strokeWidth="1.5" />
        <circle cx="34" cy="24" r="4" fill="#050505" stroke="#34D399" strokeWidth="2" />
        <path d="M10 18H22" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 24H18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 30H20" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
