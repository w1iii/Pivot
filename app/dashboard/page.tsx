"use client"

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { X, MessageCircle, User, TrendingUp, TrendingDown } from 'lucide-react';
import './page.css';
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

const StockDashboard: React.FC = () => {

  const [newSymbol, setNewSymbol] = useState('');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDropdown, setShow] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ type: "user" | "ai"; text: string }[]>([]);

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

      setInput(""); // Clear input
    };

  const addStock = async () => {
    if (!newSymbol.trim() || addStockMutation.isPending) return;
    const upper = newSymbol.toUpperCase();
    if (watchlist.find(s => s.symbol === upper)) return;

    setNewSymbol('');
    await addStockMutation.mutateAsync(upper);
  };

  const removeStock = async (id: string) => {
    await removeStockMutation.mutateAsync(id);
  };


    const handleStockClick = (stock: Stock) => {
      setSymbol(stock.symbol);
    };

   const handleLogout = async () => {
      try {
        // Call logout API to clear cookies
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Clear client-side storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirect to login
          router.push('/');
          router.refresh();
        } else {
          console.error('Logout failed');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };


  const handleIconClick = () => {
    setShow(prev => !prev);
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <h1 className="logo">Pivot.</h1> 
          </div>
          <div className="center-nav">
              <p> Market </p>
              <p> || </p>
              <p> News </p>
          </div>
          <div className="dropdown-container">
            <button className="user-button" onClick={handleIconClick}>
              <User size={24} />
            </button>

          { showDropdown && 
            <div className="user-dropdown"> 
              <div className="dropdown-items">
                <div  className="item-dropdown" >user</div>
                <div className="item-dropdown" >settings</div>
                <div className="item-dropdown" onClick={handleLogout}>logout</div>
              </div>
            </div>
          }
        </div>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="add-stock-container">
            <input
              type="text"
              placeholder="Add ticker..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addStock()}
              className="add-stock-input"
            />
            <button onClick={addStock} className="add-stock-button" disabled={addStockMutation.isPending}>
              {addStockMutation.isPending ? '...' : '+'}
            </button>
          </div>
          {watchlistLoading || authLoading ? ( <div className= "loading">Loading watchlist... </div> ): watchlistError ? (
            <div className="error">Failed to load watchlist: {watchlistErrorData?.message}</div>
          ) : (
          watchlist.map((stock) => (
            <div
              key={stock.id}
              onClick={() => handleStockClick(stock)}
              className={`stock-card ${
                selectedStock?.symbol === stock.symbol ? 'active-stock' : ''
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStock(stock.id);
                }}
                className="remove-button"
              >
                <X size={16} />
              </button>
              <div className="stock-symbol">{stock.symbol}</div>
              <div
                className="stock-price"
                style={{ color: stock.change >= 0 ? '#00FF09' : '#F78F8F' }}
              >
                ${stock.price.toFixed(2)}
              </div>
              <div
                className="stock-change"
                style={{ color: stock.change >= 0 ? '#00FF09' : '#F78F8F' }}
              >
                {stock.change >= 0 ? (
                  <TrendingUp size={14} className="trend-icon" />
                ) : (
                  <TrendingDown size={14} className="trend-icon" />
                )}
                {stock.change >= 0 ? '+' : ''}
                {stock.changePercent.toFixed(2)}%
              </div>
            </div>
            )
          ))}
           
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {!selectedStock ? (
            <div className="content-wrapper">
              {stockLoading ? (
                <div className="loading-state">Loading stock data...</div>
              ) : (
                <div className="loading-state">Select a stock from your watchlist</div>
              )}
            </div>
          ) : (
          <div className="content-wrapper">
            <div className="stock-header">
              <div className="stock-info">
                <h2 className="stock-title">
                  {selectedStock.name} ({selectedStock.symbol})
                </h2>
                <div className="price-info">
                  <span className="current-price">
                    ${selectedStock.price.toFixed(2)}
                  </span>
                  <span
                    className="price-change"
                    style={{ color: selectedStock.priceChange >= 0 ? '#00FF09' : '#F78F8F' }}
                  >
                    {selectedStock.priceChange >= 0 ? '+' : ''}${selectedStock.priceChange.toFixed(2)} (
                    {selectedStock.changePercent >= 0 ? '+' : ''}
                    {selectedStock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="ai-button"
                title="AI Analysis"
              >
                <MessageCircle size={28} />
              </button>
            </div>

            <div className="chart-container">
              <svg width="100%" height="100%" className="chart-svg">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00FF09" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00FF09" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${300 - ((selectedStock.chartData[0] ?? 200) - 150)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1000) / selectedStock.chartData.length},${300 - (point - 150)}`)
                    .join(' ')}`}
                  stroke="#00FF09"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M 0,${300 - ((selectedStock.chartData[0] ?? 200) - 150)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1000) / selectedStock.chartData.length},${300 - (point - 150)}`)
                    .join(' ')} L 1000,300 L 0,300 Z`}
                  fill="url(#chartGradient)"
                />
              </svg>
              <div className="chart-timeline">
                2:00 • 4 Mar • 08:00 • 10:00 • 14:00 • 16:00 • 18:00
              </div>
            </div>

            <div className="statistics-table">
              <div className="stats-grid">
                {Object.entries(selectedStock.statistics).map(([key, value], index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-label">{key}</div>
                    <div className="stat-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {showAIChat && selectedStock && (
                <div className="ai-chat-modal">
                  <div className="ai-chat-header">
                    <h3 className="ai-chat-title">AI Stock Analysis</h3>
                    <button
                      onClick={() => setShowAIChat(false)}
                      className="ai-close-button"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="ai-chat-content">
                    {messages.length === 0 && (
                      <div className="ai-message">
                        <p>
                          Hello! I&apos;m your AI stock analyst. Ask me anything about{" "}
                          {selectedStock.symbol}.
                        </p>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`ai-message ${msg.type === "ai" ? "ai-reply" : "user-msg"}`}
                      >
                        <p>{msg.text}</p>
                </div>
            ))}
          </div>
          <div className="ai-chat-input-container">
            <input
              type="text"
              placeholder="Ask about this stock..."
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} className="ai-send-button">
              Send
            </button>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default StockDashboard;
