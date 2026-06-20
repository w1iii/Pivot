"use client"

import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  changePercent: number;
  statistics: { [key: string]: string | number };
  chartData: number[];
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

const COMPANY_NAMES: Record<string, string> = {
  'AAPL': 'Apple Inc.',
  'GOOGL': 'Alphabet Inc.',
  'GOOG': 'Alphabet Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.',
  'META': 'Meta Platforms Inc.',
  'TSLA': 'Tesla Inc.',
  'NVDA': 'NVIDIA Corporation',
  'JPM': 'JPMorgan Chase & Co.',
  'V': 'Visa Inc.',
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
};

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

export default function WatchlistDetail() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string).toUpperCase();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ type: "user" | "ai"; text: string }[]>([]);
  const [tooltipX, setTooltipX] = useState(70);
  const [timeframe, setTimeframe] = useState('1D');
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');
      return res.json();
    },
    enabled: !!symbol,
  });

  const selectedStock: StockDetail | null =
    stockData ? buildStockDetail(symbol, stockData) : null;

  const companyName = COMPANY_NAMES[symbol] || symbol;
  const isPositive = selectedStock ? selectedStock.priceChange >= 0 : true;

  const handleChartMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setTooltipX(Math.max(0, Math.min(100, percentage)));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${input} (Stock: ${symbol})` }),
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

  if (!symbol) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-16 py-12 flex items-center justify-center min-h-[60vh]">
        <p className="text-label-md text-on-surface-variant">Loading stock data...</p>
      </div>
    );
  }

  if (!selectedStock) {
    return (
      <div className="px-16 py-12 flex items-center justify-center min-h-[60vh]">
        <p className="text-label-md text-error">Failed to load data for {symbol}.</p>
      </div>
    );
  }

  const lineColor = isPositive ? '#22c55e' : '#ffb4ab';
  const lineGradientId = `chartGradient_${symbol}`;

  return (
    <div className="px-16 py-12 flex flex-col gap-12">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center text-primary text-label-md hover:underline"
      >
        <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
        Back to Dashboard
      </button>

      {/* Stock Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant ${getLogoColor(symbol)}`}>
              <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div>
              <h2 className="text-headline-lg text-headline-lg text-on-surface">{companyName}</h2>
              <span className="text-label-md text-label-md text-on-surface-variant tracking-widest uppercase">NASDAQ: {symbol}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-headline-xl text-headline-xl text-on-surface">${selectedStock.price.toFixed(2)}</span>
            <span className="text-headline-md text-headline-md text-on-surface-variant font-normal">USD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center font-data-mono text-data-mono px-2 py-0.5 ${isPositive ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
              <span className="material-symbols-outlined text-sm mr-1">{isPositive ? 'arrow_upward' : 'arrow_downward'}</span>
              {isPositive ? '+' : ''}{selectedStock.priceChange.toFixed(2)} ({isPositive ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
            </span>
            <span className="text-on-surface-variant text-label-sm text-label-sm">Past 24h</span>
          </div>
        </div>
      </section>

      {/* Main Chart Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Primary Chart Card */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant overflow-hidden relative min-h-[480px] flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <div className="flex gap-4">
              {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-1 pb-1 text-label-md text-label-md transition-colors ${
                    timeframe === t
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="material-symbols-outlined text-on-surface-variant p-1.5 border border-outline-variant hover:bg-surface-container transition-colors">show_chart</button>
              <button className="material-symbols-outlined text-on-surface-variant p-1.5 border border-outline-variant hover:bg-surface-container transition-colors">fullscreen</button>
            </div>
          </div>

          <div
            ref={chartRef}
            onMouseMove={handleChartMove}
            className="flex-grow relative overflow-hidden"
            style={{ background: `linear-gradient(180deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 20, 21, 0) 100%)` }}
          >
            <svg className="w-full h-full absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <defs>
                <linearGradient id={lineGradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,350 L100,340 L200,360 L300,320 L400,280 L500,290 L600,240 L700,260 L800,210 L900,180 L1000,160 V400 H0 Z"
                fill={`url(#${lineGradientId})`}
              />
              <path
                d="M0,350 L100,340 L200,360 L300,320 L400,280 L500,290 L600,240 L700,260 L800,210 L900,180 L1000,160"
                fill="none"
                stroke={lineColor}
                strokeWidth="2.5"
              />
            </svg>
            {/* Tooltip */}
            <div className="absolute top-[40%] flex flex-col items-center" style={{ left: `${tooltipX}%` }}>
              <div className="w-0.5 h-64 bg-outline-variant"></div>
              <div className="bg-primary text-on-primary px-3 py-2 shadow-xl -mt-32 z-10">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Jun 20, 14:30</p>
                <p className="font-data-mono text-sm">${selectedStock.price.toFixed(2)}</p>
              </div>
              <div className={`w-3 h-3 rounded-full border-2 border-surface shadow-sm ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}></div>
            </div>
          </div>

          <div className="p-6 border-t border-outline-variant grid grid-cols-4 md:grid-cols-6 gap-4 bg-surface-container">
            <div className="flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Open</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['Open']}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">High</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['High']}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Low</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['Low']}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Volume</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['Volume']}</span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Avg Vol</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['Avg Volume']}</span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Mkt Cap</span>
              <span className="font-data-mono text-data-mono text-on-surface">{selectedStock.statistics['Market Cap']}</span>
            </div>
          </div>
        </div>

        {/* Side Metrics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* AI Chat Analysis */}
          <div className="bg-surface-container border border-outline-variant p-6 flex flex-col gap-6 flex-grow min-h-[300px]">
            <div className="flex justify-between items-center">
              <h3 className="text-headline-md text-headline-md text-on-surface">AI Stock Analysis</h3>
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
            </div>
            <div className="flex-grow flex flex-col min-h-0">
              <div className="flex-1 max-h-48 overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 && (
                  <div className="p-3 bg-surface-container-low border border-outline-variant/30">
                    <p className="text-body-sm text-on-surface-variant">
                      Hello! I&apos;m your AI stock analyst. Ask me anything about {symbol}.
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`p-3 ${msg.type === 'ai' ? 'bg-surface-container-low border border-outline-variant/30' : 'bg-primary/10 border border-primary/20'}`}>
                    <p className="text-body-sm text-on-surface">{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  type="text"
                  placeholder="Ask about this stock..."
                  className="flex-1 bg-surface border border-outline-variant px-3 py-2 text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-primary text-on-primary text-label-sm hover:brightness-110 transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Analyst Ratings */}
          <div className="bg-surface-container-low border border-outline-variant p-6 flex flex-col gap-6 flex-grow">
            <h3 className="text-headline-md text-headline-md text-on-surface">Analyst Ratings</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#323537"
                    strokeDasharray="100, 100"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#b3c5ff"
                    strokeDasharray="82, 100"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-data-mono text-headline-md text-headline-md text-on-surface">82%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface font-bold text-label-md">Strong Buy</span>
                <p className="text-label-sm text-label-sm text-on-surface-variant">Based on 45 analyst recommendations from major institutions.</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-outline-variant">
              <div className="flex justify-between items-center">
                <span className="text-label-md text-label-md text-on-surface-variant">Price Target (Avg)</span>
                <span className="font-data-mono text-on-surface">$195.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-label-md text-label-md text-on-surface-variant">Institutions Holding</span>
                <span className="font-data-mono text-on-surface">78.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
