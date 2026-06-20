"use client"

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface Stock {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
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

export default function MarketPage() {
  const [newSymbol, setNewSymbol] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: watchlist = [], isLoading, isError, error } = useQuery<Stock[]>({
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
      await fetch(`/api/stock?symbol=${upper}`);
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: upper }),
      });
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

  const addStock = async () => {
    const upper = newSymbol.toUpperCase().trim();
    if (!upper || addStockMutation.isPending) return;
    if (watchlist.find(s => s.symbol === upper)) return;
    setNewSymbol('');
    await addStockMutation.mutateAsync(upper);
  };

  const gainers = watchlist.filter(s => s.changePercent > 0).length;
  const losers = watchlist.filter(s => s.changePercent < 0).length;
  const totalValue = watchlist.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="px-16 py-12 space-y-12">
      <section className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Full Market</h2>
            <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">
              Comprehensive overview of all tracked securities across global markets.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-low pl-4 pr-2 py-1.5 rounded-full border border-outline-variant">
              <input
                type="text"
                placeholder="Add symbol..."
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addStock()}
                className="bg-transparent border-none focus:ring-0 text-label-md font-label-md w-28 placeholder:text-on-surface-variant/50"
              />
              <button
                onClick={addStock}
                disabled={addStockMutation.isPending}
                className="ml-2 p-2 bg-primary text-on-primary rounded-full hover:brightness-110 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Tracked</div>
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
          <div className="bg-surface-container border border-outline-variant p-6 rounded">
            <div className="text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Total Value</div>
            <div className="text-headline-xl font-headline-xl text-on-surface">${totalValue.toFixed(0)}</div>
            <div className="text-label-sm text-label-sm text-on-surface-variant mt-1">Aggregate</div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <p className="text-label-md text-on-surface-variant">Loading market data...</p>
          </div>
        ) : isError ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <p className="text-label-md text-error">Failed to load: {error?.message}</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-4">monitoring</span>
              <p className="text-headline-md font-headline-md text-on-surface mb-2">No securities tracked</p>
              <p className="text-body-md text-on-surface-variant mb-6">Add symbols using the search bar above to start monitoring markets.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-primary text-on-primary text-label-md rounded-lg hover:brightness-110 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Symbol</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Price</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Change</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Change %</th>
                  <th className="text-right px-6 py-4 text-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((stock) => (
                  <tr
                    key={stock.id}
                    className="border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors cursor-pointer group"
                    onClick={() => router.push('/dashboard')}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getLogoColor(stock.symbol)} flex items-center justify-center text-on-primary font-bold text-xs rounded`}>
                          {stock.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="text-label-md text-on-surface">{stock.symbol}</div>
                          <div className="text-[10px] text-on-surface-variant uppercase">{stock.symbol} Inc.</div>
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
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStockMutation.mutate(stock.id);
                        }}
                        className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove_circle_outline</span>
                      </button>
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
