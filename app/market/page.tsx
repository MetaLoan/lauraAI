'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Soulmate content is merged into Dashboard.
 * Redirect /market to /dashboard#soulmates for backward compatibility.
 */
export default function MarketPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard#soulmates');
    }, [router]);
    return null;
}
