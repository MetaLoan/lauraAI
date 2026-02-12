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
            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
        />
    </div>
);

export const IconDashboard = ({ className }: IconProps) => (
    <IconBase src="dashboard" alt="Dashboard" className={className} />
);

export const IconMarket = ({ className }: IconProps) => (
    <IconBase src="market" alt="Market" className={className} />
);

export const IconSoulmate = ({ className }: IconProps) => (
    <IconBase src="soulmate" alt="Soulmate" className={className} />
);

export const IconMint = ({ className }: IconProps) => (
    <IconBase src="mint" alt="Mint" className={className} />
);

export const IconMine = ({ className }: IconProps) => (
    <IconBase src="mine" alt="Mine" className={className} />
);

export const IconProfile = ({ className }: IconProps) => (
    <IconBase src="profile" alt="Profile" className={className} />
);
