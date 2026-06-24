"use client"

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getLogoColor, COMPANY_NAMES } from '../../lib/stock-utils';

interface Stock {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();

  const { data: watchlist = [], isLoading } = useQuery<Stock[]>({
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

  const totalValue = watchlist.reduce((sum, s) => sum + s.price, 0);
  const gainers = watchlist.filter(s => s.changePercent > 0).length;
  const losers = watchlist.filter(s => s.changePercent < 0).length;

  return (
    <div className="px-16 py-12 space-y-12">
      <section className="max-w-[1280px] mx-auto">
        <div className="mb-12">
          <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Portfolio</h2>
          <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">
            Track and analyze your tracked securities.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Total Value</div>
            <div className="text-headline-xl font-headline-xl text-on-surface">${totalValue.toFixed(2)}</div>
            <div className="text-label-sm text-label-sm text-on-surface-variant mt-1">Aggregate</div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Holdings</div>
            <div className="text-headline-xl font-headline-xl text-on-surface">{watchlist.length}</div>
            <div className="text-label-sm text-label-sm text-on-surface-variant mt-1">Securities</div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Gainers</div>
            <div className="text-headline-xl font-headline-xl text-primary">{gainers}</div>
            <div className="text-label-sm text-label-sm text-on-surface-variant mt-1">Positive change</div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Losers</div>
            <div className="text-headline-xl font-headline-xl text-error">{losers}</div>
            <div className="text-label-sm text-label-sm text-on-surface-variant mt-1">Negative change</div>
          </div>
        </div>

        {/* Holdings Table */}
        {isLoading ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <p className="text-label-md text-on-surface-variant">Loading portfolio...</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-4">pie_chart</span>
              <p className="text-headline-md font-headline-md text-on-surface mb-2">No holdings yet</p>
              <p className="text-body-md text-on-surface-variant">Add securities to your watchlist to see portfolio data.</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Holding</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Price</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Change</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Change %</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((stock) => (
                  <tr key={stock.id} className="border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getLogoColor(stock.symbol)} flex items-center justify-center text-on-primary font-bold text-xs rounded`}>
                          {stock.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="text-label-md text-on-surface">{stock.symbol}</div>
                          <div className="text-[10px] text-on-surface-variant uppercase">{COMPANY_NAMES[stock.symbol] || stock.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-label-md text-on-surface">${stock.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`text-label-md ${stock.change >= 0 ? 'text-primary' : 'text-error'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`text-label-md font-bold ${stock.changePercent >= 0 ? 'text-primary' : 'text-error'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
