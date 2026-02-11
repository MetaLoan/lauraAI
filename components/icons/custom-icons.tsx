import React from 'react';

export const IconDashboard = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 10C4 6.68629 6.68629 4 10 4H14C17.3137 4 20 6.68629 20 10V14C20 17.3137 17.3137 20 14 20H10C6.68629 20 4 17.3137 4 14V10Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="7" r="2" className="fill-purple-500/50" />
        <circle cx="7" cy="17" r="2" className="fill-blue-500/50" />
    </svg>
);

export const IconMarket = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 12L13 13M12 12L11 13M12 12L13 11M12 12L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" className="fill-purple-500/20" />
    </svg>
);

export const IconSoulmate = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="8.5" cy="9" r="1.5" className="fill-pink-500/40" />
        <circle cx="15.5" cy="9" r="1.5" className="fill-purple-500/40" />
        <path d="M12 13C12 13 10 11.5 8.5 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-50" />
        <path d="M12 13C12 13 14 11.5 15.5 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-50" />
    </svg>
);

export const IconMint = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 2V6" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
        <path d="M12 18V22" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
        <path d="M22 12H18" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
        <path d="M6 12H2" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
    </svg>
);

export const IconMine = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M20 12V17C20 18.8856 20 19.8284 19.4142 20.4142C18.8284 21 17.8856 21 16 21H8C6.11438 21 5.17157 21 4.58579 20.4142C4 19.8284 4 18.8856 4 17V12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 7L6.31429 3.56286C7.59553 2.52095 8.23614 2 9 2H15C15.7639 2 16.4045 2.52095 17.6857 3.56286L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15C9 13.3431 10.3431 12 12 12C13.6569 12 15 13.3431 15 15Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="15" r="1.5" className="fill-amber-500/40" />
        <path d="M12 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-50" />
    </svg>
);

export const IconProfile = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L12 15" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="19" cy="5" r="2" className="fill-green-500/50" />
    </svg>
);
