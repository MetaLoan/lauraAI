import React from 'react';
import { cn, getAssetPath } from '@/lib/utils';

interface IconProps {
    className?: string;
}

const IconBase = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <div className={cn("relative flex items-center justify-center", className)}>
        <img
            src={getAssetPath(`/icons/3d/${src}.png`)}
            alt={alt}
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
        />
    </div>
);

// Enhanced Heart Icon - 3D Style
export const IconHeartPulse = ({ className }: IconProps) => (
    <IconBase src="heart_pulse" alt="Heart Pulse" className={className} />
);

// Enhanced Shield Icon - 3D Style
export const IconCyberShield = ({ className }: IconProps) => (
    <IconBase src="shield" alt="Cyber Shield" className={className} />
);

// Enhanced Wallet Icon - 3D Style
export const IconDeFiWallet = ({ className }: IconProps) => (
    <IconBase src="wallet" alt="DeFi Wallet" className={className} />
);
