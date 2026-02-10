'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { Loader2, RefreshCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pool {
    name: string;
    apy: number;
    tvl: string;
    tvl_number: number;
    trend: string;
    volume_24h: string;
    fee_tier: string;
}

interface HistoricalData {
    date: string;
    yield: number;
    tvl: number;
}

interface MarketData {
    bnb_price: string;
    gas_price: string;
    sentiment: string;
    timestamp: number;
    v3_pools: Pool[];
}

interface PoolsData {
    pools: Pool[];
    historical: HistoricalData[];
    updated_at: number;
}

export function DefiAnalytics() {
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [poolsData, setPoolsData] = useState<PoolsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [market, pools] = await Promise.all([
                apiClient.getMarketIntelligence(),
                apiClient.getPools().catch(() => null)
            ]);
            
            setMarketData(market as MarketData);
            if (pools) {
                setPoolsData(pools as PoolsData);
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch DeFi data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-400" />;
            default:
                return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment.includes('Bullish') || sentiment === 'Very Bullish') return 'text-green-400';
        if (sentiment.includes('Bearish')) return 'text-red-400';
        if (sentiment === 'Cautious') return 'text-yellow-400';
        return 'text-gray-400';
    };

    // Use real data from API or fallback to mock
    const chartData = poolsData?.historical || [
        { date: 'Mon', yield: 12.5, tvl: 3800000 },
        { date: 'Tue', yield: 14.2, tvl: 3950000 },
        { date: 'Wed', yield: 13.8, tvl: 4100000 },
        { date: 'Thu', yield: 15.5, tvl: 4250000 },
        { date: 'Fri', yield: 18.2, tvl: 4400000 },
        { date: 'Sat', yield: 17.5, tvl: 4550000 },
        { date: 'Sun', yield: 19.8, tvl: 4700000 },
    ];

    const pools = marketData?.v3_pools || poolsData?.pools || [];
    const totalTVL = pools.reduce((sum, pool) => sum + (pool.tvl_number || 0), 0);
    const avgAPY = pools.length > 0 
        ? pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length 
        : 0;

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="bg-black/40 border-white/10 backdrop-blur-sm h-[350px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </Card>
                <Card className="bg-black/40 border-white/10 backdrop-blur-sm h-[350px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            {/* Market Overview Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-6">
                    <div>
                        <span className="text-gray-400 text-xs">BNB Price</span>
                        <p className="text-white font-semibold">${parseFloat(marketData?.bnb_price || '0').toFixed(2)}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Gas Price</span>
                        <p className="text-white font-semibold">{marketData?.gas_price || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Sentiment</span>
                        <p className={cn("font-semibold", getSentimentColor(marketData?.sentiment || 'Neutral'))}>
                            {marketData?.sentiment || 'Neutral'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <RefreshCcw className="w-3 h-3" />
                    {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
                </div>
            </div>

            {/* Pool Cards */}
            {pools.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pools.map((pool, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-semibold">{pool.name}</span>
                                {getTrendIcon(pool.trend)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500 text-xs">APY</span>
                                    <p className="text-green-400 font-semibold">{pool.apy.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">TVL</span>
                                    <p className="text-white">{pool.tvl}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">24h Vol</span>
                                    <p className="text-gray-300">{pool.volume_24h || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">Fee</span>
                                    <p className="text-gray-300">{pool.fee_tier || '0.25%'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-medium flex justify-between items-center">
                            Yield Performance (APY)
                            <span className="text-green-400 text-sm font-normal">
                                Avg: {avgAPY.toFixed(1)}%
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'APY']}
                                    />
                                    <Area type="monotone" dataKey="yield" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorYield)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-medium flex justify-between items-center">
                            Total Value Locked (TVL)
                            <span className="text-blue-400 text-sm font-normal">
                                ${(totalTVL / 1000000).toFixed(2)}M Total
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'TVL']}
                                    />
                                    <Line type="monotone" dataKey="tvl" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
