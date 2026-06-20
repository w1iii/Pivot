"use client"

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext';

interface Stock {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  changePercent: number;
  statistics: {
    [key: string]: string | number;
  };
  chartData: number[];
}

const LOGO_COLORS = [
  'bg-primary',
  'bg-secondary-container',
  'bg-surface-container-highest',
  'bg-tertiary-container',
  'bg-error-container',
  'bg-secondary',
];

function getLogoColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function buildStockDetail(symbol: string, data: Record<string, string>): StockDetail {
  const avgVol = data.avgVolume
    ? `${(parseFloat(data.avgVolume) / 1_000_000).toFixed(2)}M`
    : 'N/A';
  const mktCap = data.marketCap
    ? `$${(parseFloat(data.marketCap) / 1_000_000_000).toFixed(2)}B`
    : 'N/A';

  return {
    symbol,
    name: symbol,
    price: parseFloat(data.price) || 0,
    priceChange: parseFloat(data.change) || 0,
    changePercent: parseFloat(data.changePercent) || 0,
    statistics: {
      'Open': parseFloat(data.open)?.toFixed(2) || '0.00',
      'High': parseFloat(data.high)?.toFixed(2) || '0.00',
      'Low': parseFloat(data.low)?.toFixed(2) || '0.00',
      'Volume': data.volume ? `${(parseFloat(data.volume) / 1000000).toFixed(2)}M` : '0',
      'Avg Volume': avgVol,
      'Market Cap': mktCap,
    },
    chartData: Array.from({ length: 50 }, (_, i) =>
      symbol.charCodeAt(0) * 2 + (i * 3)
    ),
  };
}

const Dashboard: React.FC = () => {

  const [newSymbol, setNewSymbol] = useState('');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ type: "user" | "ai"; text: string }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const router = useRouter()
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const res = await fetch(`../api/stock?symbol=${symbol}`);
      if (!res.ok) throw new Error('server error');
      return res.json();
    },
    enabled: !!symbol,
  });

  const selectedStock: StockDetail | null =
    symbol && stockData ? buildStockDetail(symbol, stockData) : null;

  const { data: watchlist = [], isLoading: watchlistLoading, isError: watchlistError, error: watchlistErrorData } = useQuery<Stock[]>({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      const saved: { symbol: string }[] = await res.json();
      if (saved.length === 0) return [];

      const symbols = saved.map(s => s.symbol);
      const batchRes = await fetch('/api/stock/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (!batchRes.ok) throw new Error('Failed to fetch stocks');
      const stocksData = await batchRes.json();

      return symbols.map((sym: string) => {
        const data = stocksData[sym] || {};
        const price = parseFloat(data.price);
        const change = parseFloat(data.change);
        const changePercent = parseFloat(String(data.changePercent ?? '').replace('%', '') || '0');
        return {
          id: sym,
          symbol: sym,
          price: isNaN(price) ? 0 : price,
          change: isNaN(change) ? 0 : change,
          changePercent: isNaN(changePercent) ? 0 : changePercent,
        };
      });
    },
    enabled: !!user?.id && !authLoading,
  });

  const addStockMutation = useMutation({
    mutationFn: async (upper: string) => {
      const res = await fetch(`/api/stock?symbol=${upper}`);
      const data = await res.json();

      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: upper }),
      });

      return { symbol: upper, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });

  const removeStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });

    const handleSend = async () => {
      if (!input.trim() || !selectedStock) return;

      setMessages((prev) => [...prev, { type: "user", text: input }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `${input} (Stock: ${selectedStock.symbol})` }),
        });

        const data = await res.json();

        if (data.reply) {
          setMessages((prev) => [...prev, { type: "ai", text: data.reply }]);
        } else if (data.error) {
          setMessages((prev) => [
            ...prev,
            { type: "ai", text: `Error: ${data.error}` },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: "Failed to get response from AI." },
        ]);
      }

      setInput("");
    };

  const addStock = async () => {
    if (!newSymbol.trim() || addStockMutation.isPending) return;
    const upper = newSymbol.toUpperCase();
    if (watchlist.find(s => s.symbol === upper)) return;

    setNewSymbol('');
    setShowAddForm(false);
    await addStockMutation.mutateAsync(upper);
  };

  const removeStock = async (id: string) => {
    await removeStockMutation.mutateAsync(id);
  };

    const handleStockClick = (stock: Stock) => {
      router.push(`/dashboard/watchlist/${stock.symbol}`);
    };

    const clearSelectedStock = () => {
      setSymbol(null);
      setShowAIChat(false);
      setMessages([]);
    };

  const isPositive = selectedStock ? selectedStock.priceChange >= 0 : true;

  return (
    <div className="px-16 py-12 space-y-16">

      {!selectedStock ? (
        <>
          {/* Market Overview */}
          <section className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Market Overview</h2>
                <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">Strategic insights and institutional data streams. Current market sentiment is cautiously bullish as quarterly reports materialize.</p>
              </div>
              <div className="text-right">
                <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Last Update</div>
                <div className="text-label-md text-label-md text-primary">14:23:45 EST — JUL 24</div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Index Performance */}
              <div className="col-span-12 lg:col-span-8 bg-surface-container border border-outline-variant p-8 relative overflow-hidden group rounded">
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h3 className="text-headline-md font-headline-md text-on-surface mb-1">Index Performance</h3>
                    <p className="text-label-md text-label-md text-on-surface-variant">Real-time volatility analysis</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-label-sm text-label-sm rounded-full">S&amp;P 500</span>
                    <span className="px-3 py-1 border border-outline-variant text-on-surface-variant text-label-sm text-label-sm rounded-full">NASDAQ</span>
                    <span className="px-3 py-1 border border-outline-variant text-on-surface-variant text-label-sm text-label-sm rounded-full">DOW</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 relative z-10">
                  <div className="w-full md:w-1/2">
                    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest"></circle>
                        <circle cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeDasharray="691" strokeDashoffset="180" strokeWidth="8" className="text-primary transition-all duration-1000"></circle>
                        <circle cx="128" cy="128" fill="transparent" r="90" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest"></circle>
                        <circle cx="128" cy="128" fill="transparent" r="90" stroke="currentColor" strokeDasharray="565" strokeDashoffset="200" strokeWidth="8" className="text-secondary transition-all duration-1000"></circle>
                      </svg>
                      <div className="text-center">
                        <div className="text-headline-xl font-headline-xl text-on-surface leading-none">+2.4<span className="text-headline-md">%</span></div>
                        <div className="text-label-sm text-label-sm text-on-surface-variant uppercase mt-2 tracking-tighter">Aggregate Growth</div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 space-y-6">
                    <div>
                      <div className="flex justify-between text-label-md text-label-md mb-2 text-on-surface">
                        <span>Institutional Buy Pressure</span>
                        <span className="text-primary">84%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest overflow-hidden">
                        <div className="h-full bg-primary w-[84%] transition-all duration-1000"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-label-md text-label-md mb-2 text-on-surface">
                        <span>Retail Sentiment</span>
                        <span className="text-secondary">62%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest overflow-hidden">
                        <div className="h-full bg-secondary w-[62%] transition-all duration-1000"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-label-md text-label-md mb-2 text-on-surface">
                        <span>Volatility Index (VIX)</span>
                        <span className="text-tertiary">14.2</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest overflow-hidden">
                        <div className="h-full bg-tertiary w-[14%] transition-all duration-1000"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <img className="w-[400px] object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmH7ewCZTtJb3GWj1WsBLx-wJKzoizqhIrPfSL2GVALylFjFjGj5BL8nhtJTuuchMqFvGNkSV8HWRyvlt0H8qnKxU1Oyx6ipLBWCe-h3R8wOmSudgX8FfTG8xsvz2YNxG59lStBAQvaDISSWJl3CWOxXktro7n_erTt7QwQfdmVFsDVkbhyoKiFwcAguFBW0GeUvJZeW0yeT9z4Js1y0a23ACmuajw3XoYRHoo2vXwuQS4BVEgjIk-Nxvvl6k_1CSQbG_jnuJQ_Xw" alt="" />
                </div>
              </div>

              {/* Watchlist */}
              <div className="col-span-12 lg:col-span-4 bg-surface-container border border-outline-variant p-8 flex flex-col rounded">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-headline-md font-headline-md text-on-surface">Watchlist</h3>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showAddForm ? 'close' : 'add_circle'}
                  </button>
                </div>

                {showAddForm && (
                  <div className="mb-6 p-4 bg-surface-container-low border border-outline-variant rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Symbol (e.g. AAPL)"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && addStock()}
                        className="flex-1 bg-surface border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all"
                      />
                      <button
                        onClick={addStock}
                        disabled={addStockMutation.isPending}
                        className="px-4 py-2 bg-primary text-on-primary text-label-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {addStockMutation.isPending ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}

                {watchlistLoading || authLoading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-label-md text-on-surface-variant">Loading watchlist...</p>
                  </div>
                ) : watchlistError ? (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-label-md text-error">Failed to load watchlist: {watchlistErrorData?.message}</p>
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-label-md text-on-surface-variant">No tickers tracked. Add one above.</p>
                  </div>
                ) : (
                  <div className="flex-grow space-y-4">
                    {watchlist.map((stock) => (
                      <div
                        key={stock.id}
                        onClick={() => handleStockClick(stock)}
                        className="flex items-center justify-between pb-4 border-b border-outline-variant/30 hover:bg-surface-container-high px-2 -mx-2 transition-colors cursor-pointer group rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${getLogoColor(stock.symbol)} flex items-center justify-center text-on-primary font-bold text-xs rounded`}>
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="text-label-md text-on-surface">{stock.symbol}</div>
                            <div className="text-[10px] text-on-surface-variant uppercase">Market</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-label-md text-on-surface">${stock.price.toFixed(2)}</div>
                          <div className={`text-[10px] font-bold ${stock.changePercent >= 0 ? 'text-primary' : 'text-error'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStock(stock.id);
                          }}
                          className="ml-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => router.push('/dashboard/market')}
                  className="mt-8 w-full py-4 bg-primary text-on-primary text-label-md text-label-md uppercase tracking-widest hover:brightness-110 transition-all rounded"
                >
                  View Full Market
                </button>
              </div>
            </div>
          </section>

          {/* Bottom Content */}
          <section className="max-w-[1280px] mx-auto grid grid-cols-12 gap-6 pb-16">
            <div className="col-span-12 lg:col-span-7 bg-surface-container border border-outline-variant p-8 rounded">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-headline-md font-headline-md text-on-surface">Strategic Intelligence</h3>
                <a className="text-primary text-label-md text-label-md flex items-center hover:underline" href="#">
                  Explore All News
                  <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                </a>
              </div>
              <div className="space-y-10">
                <article className="flex gap-6 group cursor-pointer">
                  <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low overflow-hidden rounded">
                    <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc2xbHAD0i1xmik_H-g5GFU8FjazhlBce50vdYEEUWCOCU8NlwNX9GZlkNMzS_Au93PLOokbzRDlovC2Hi0ko_nQnGX1r2lpXpNXnEUZFjCbS2qSuAm1QReM7EEoD_21XPTU7RfW5cm7rnUSCY4-ColgabeL6LUnhA6Mz9pD-1-Z68AmG1xTxVXch8d-FVcd6rEEalyn9_CRuKpqBBk7SRNRIAM3pTA0DT9p9Iv7rwf1Hu4cw-oKXt8lcyy6Yf2SRLaT4WceCAF8Y" alt="" />
                  </div>
                  <div>
                    <span className="text-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Monetary Policy</span>
                    <h4 className="text-headline-md font-headline-md text-on-surface mt-1 group-hover:text-primary transition-colors">FED signals potential pause in rate hikes for upcoming Q3 sessions</h4>
                    <p className="text-body-md text-body-md text-on-surface-variant mt-2 line-clamp-2 opacity-80">Recent economic data suggests a softening in labor demand, prompting analysts to project a more dovish stance from central banks globally.</p>
                  </div>
                </article>
                <article className="flex gap-6 group cursor-pointer">
                  <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low overflow-hidden rounded">
                    <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAibOxsbCgW72mAaK8ew5Sdgkaf2EhvSeGJ5kMpSexkarlQm7tevwxsaJSoR0vx3cjWy899WgbGiCtkBVDdXOEV0fVRcmtBSMAHD0lCrS_-kzntwz0uT7TXwGeb9tv1WqpmeQem_R05kSOjyq0rWxK6i_NEMtfUcsB-WU84_j22GHwZ60Y0mEaWz8BYogehFgRBBm5jtGHjMyAPS-7mPx0ncLFZaNqoje1CPhr1uw1IQRuIdMqtyEYn64N-U2SL5Ej1K_T7M-5Ky6g" alt="" />
                  </div>
                  <div>
                    <span className="text-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Tech Sector</span>
                    <h4 className="text-headline-md font-headline-md text-on-surface mt-1 group-hover:text-primary transition-colors">Semiconductor demand surges as AI infrastructure enters second phase</h4>
                    <p className="text-body-md text-body-md text-on-surface-variant mt-2 line-clamp-2 opacity-80">The global supply chain prepares for a significant increase in production capacity to meet the demands of enterprise-level AI deployments.</p>
                  </div>
                </article>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 bg-surface-container-high border border-outline-variant p-8 rounded">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-8">Asset Allocation</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-label-md text-label-md mb-2 text-on-surface">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary mr-2 rounded-sm"></span>
                      <span>Equities</span>
                    </div>
                    <span className="text-primary">42.5%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-lowest overflow-hidden">
                    <div className="h-full bg-primary w-[42.5%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-label-md text-label-md mb-2 text-on-surface">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-secondary mr-2 rounded-sm"></span>
                      <span>Fixed Income</span>
                    </div>
                    <span className="text-secondary">28.0%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-lowest overflow-hidden">
                    <div className="h-full bg-secondary w-[28%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-label-md text-label-md mb-2 text-on-surface">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-tertiary mr-2 rounded-sm"></span>
                      <span>Commodities</span>
                    </div>
                    <span className="text-tertiary">15.5%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-lowest overflow-hidden">
                    <div className="h-full bg-tertiary w-[15.5%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-label-md text-label-md mb-2 text-on-surface">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-outline mr-2 rounded-sm"></span>
                      <span>Cash Equivalents</span>
                    </div>
                    <span className="text-on-surface-variant">14.0%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-lowest overflow-hidden">
                    <div className="h-full bg-outline w-[14%]"></div>
                  </div>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-outline-variant/30">
                <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Portfolio Value</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-headline-xl font-headline-xl text-on-surface leading-none">$2,845,120</span>
                  <span className="text-primary font-bold text-headline-md">+4.8%</span>
                </div>
                <p className="text-label-md text-label-md text-on-surface-variant mt-2">Adjusted for inflation and management fees.</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Stock Detail View */
        <section className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={clearSelectedStock}
              className="flex items-center text-primary text-label-md hover:underline"
            >
              <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
              Back to Market
            </button>
            <div className="text-right">
              <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Real-time Quote</div>
              <div className="text-label-md text-label-md text-primary">Streaming</div>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant p-8 rounded mb-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-headline-xl font-headline-xl text-on-surface">{selectedStock.symbol}</h2>
                  <span className="text-body-lg text-on-surface-variant">{selectedStock.name}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-headline-lg font-headline-lg text-on-surface">${selectedStock.price.toFixed(2)}</span>
                  <span className={`text-headline-md font-headline-md ${isPositive ? 'text-primary' : 'text-error'}`}>
                    {isPositive ? '+' : ''}{selectedStock.priceChange.toFixed(2)} ({isPositive ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setShowAIChat(!showAIChat); if (!showAIChat) setMessages([]); }}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary text-label-md rounded-lg hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                AI Analysis
              </button>
            </div>

            <div className="h-64 relative">
              <svg width="100%" height="100%" className="w-full h-full">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b3c5ff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#b3c5ff" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${200 - ((selectedStock.chartData[0] ?? 200) - 100)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1200) / selectedStock.chartData.length},${200 - (point - 100)}`)
                    .join(' ')}`}
                  stroke="#b3c5ff"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M 0,${200 - ((selectedStock.chartData[0] ?? 200) - 100)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1200) / selectedStock.chartData.length},${200 - (point - 100)}`)
                    .join(' ')} L 1200,200 L 0,200 Z`}
                  fill="url(#chartGradient)"
                />
              </svg>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant p-8 rounded">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Statistics</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {Object.entries(selectedStock.statistics).map(([key, value], index) => (
                <div key={index}>
                  <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">{key}</div>
                  <div className="text-label-md text-label-md text-on-surface">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat Panel */}
          {showAIChat && (
            <div className="mt-6 bg-surface-container border border-outline-variant p-8 rounded">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-headline-md font-headline-md text-on-surface">AI Stock Analysis</h3>
                <button onClick={() => setShowAIChat(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto mb-6 space-y-4">
                {messages.length === 0 && (
                  <div className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-lg">
                    <p className="text-body-md text-on-surface-variant">
                      Hello! I&apos;m your AI stock analyst. Ask me anything about {selectedStock.symbol}.
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${msg.type === 'ai' ? 'bg-surface-container-low border border-outline-variant/30' : 'bg-primary/10 border border-primary/20'}`}>
                    <p className="text-body-md text-on-surface">{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask about this stock..."
                  className="flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-3 bg-primary text-on-primary text-label-md rounded-lg hover:brightness-110 transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
};

export default Dashboard;
