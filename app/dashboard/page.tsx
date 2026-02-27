"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, X, MessageCircle, User, TrendingUp, TrendingDown } from 'lucide-react';
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
  marketCap?: string;
  tradingView?: string;
  statistics: {
    [key: string]: string | number;
  };
  chartData: number[];
}


const StockDashboard: React.FC = () => {
  // const [watchlist, setWatchlist] = useState<Stock[]>([
  //   { id: '1', symbol: 'TSLA', price: 255.30, change: 6.35, changePercent: 2.55 },
  //   { id: '2', symbol: 'AAPL', price: 255.30, change: -0.75, changePercent: -0.75 },
  //   { id: '3', symbol: 'GOOGL', price: 255.30, change: 2.55, changePercent: 2.55 },
  //   { id: '4', symbol: 'AMAZN', price: 255.30, change: 2.55, changePercent: 2.55 },
  // ]);

  const [watchlist, setWatchlist] = useState<Stock[]>([]); // start empty, load from DB
  const [newSymbol, setNewSymbol] = useState('');
  
  const [symbol, setSymbol] = useState('TSLA');
  
  const [selectedStock, setSelectedStock] = useState<StockDetail>({
    symbol: 'TSLA',
    name: 'Tesla, inc.',
    price: 255.30,
    priceChange: 2.55,
    changePercent: 2.55,
    marketCap: '$800B',
    tradingView: 'Buy',
    statistics: {
      'Open': '0.00',
      'High': '0.00',
      'Low': '0.00',
      'Volume': '0',
      'Avg Volume': '0',
      'Market Cap': '$800.5B',
    },
    chartData: [250, 245, 260, 255, 270, 265, 280, 275, 290, 285, 300, 295, 310, 305, 320, 315, 330, 325, 340, 335, 350, 345, 360, 355, 370, 365, 380, 375, 390, 385, 400, 395, 410, 405, 420, 415, 430, 425, 440, 435, 450, 445, 460, 455, 470, 465, 480, 475, 490, 485],
  });

  const [showAIChat, setShowAIChat] = useState(false);
  const [showDropdown, setShow] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ type: "user" | "ai"; text: string }[]>([
    { type: "ai", text: `Hello! I'm your AI stock analyst. Ask me anything about ${selectedStock.symbol}.` }
  ]);

  const router = useRouter()
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch stock data when symbol changes
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const res = await fetch(`../api/stock?symbol=${symbol}`);
      if (!res.ok) throw new Error('server error');
      return res.json();
    },
    enabled: !!symbol,
  });

  // Update selectedStock when stockData changes
  useEffect(() => {
    if (stockData) {
      const avgVol = stockData.avgVolume
        ? `${(parseFloat(stockData.avgVolume) / 1_000_000).toFixed(2)}M`
        : 'N/A';
      const mktCap = stockData.marketCap
        ? `$${(parseFloat(stockData.marketCap) / 1_000_000_000).toFixed(2)}B`
        : 'N/A';
        
      setSelectedStock(prev => ({
        ...prev,
        symbol: symbol,
        price: parseFloat(stockData.price) || prev.price,
        priceChange: parseFloat(stockData.change) || prev.priceChange,
        changePercent: parseFloat(stockData.changePercent) || prev.changePercent,
        statistics: {
          'Open': parseFloat(stockData.open)?.toFixed(2) || '0.00',
          'High': parseFloat(stockData.high)?.toFixed(2) || '0.00',
          'Low': parseFloat(stockData.low)?.toFixed(2) || '0.00',
          'Volume': stockData.volume ? `${(parseFloat(stockData.volume) / 1000000).toFixed(2)}M` : '0',
          'Avg Volume': avgVol,   
          'Market Cap': mktCap,
        }
      }));
    }
  }, [stockData, symbol]); 

  // LOAD WATCH LIST
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      const saved: { symbol: string }[] = await res.json();
      
      if (saved.length === 0) return [];

      // Use batch endpoint to fetch all stocks at once
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
        return {
          id: sym,
          symbol: sym,
          price: parseFloat(data.price) || 0,
          change: parseFloat(data.change) || 0,
          changePercent: parseFloat(data.changePercent) || 0,
        };
        });
    },
    enabled: !!user?.id,
  });

  // Sync watchlist data to state
  useEffect(() => {
    if (watchlistData) {
      setWatchlist(watchlistData);
    }
  }, [watchlistData]);

  // Mutations for watchlist
  const addStockMutation = useMutation({
    mutationFn: async (upper: string) => {
      // 1. Fetch stock price data
      const res = await fetch(`/api/stock?symbol=${upper}`);
      const data = await res.json();
      
      // 2. Save to database
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: upper }),
      });
      
      return { symbol: upper, data };
    },
    onSuccess: (result) => {
      const stock: Stock = {
        id: result.symbol,
        symbol: result.symbol,
        price: parseFloat(result.data.price) || 0,
        change: parseFloat(result.data.change) || 0,
        changePercent: parseFloat(result.data.changePercent) || 0,
      };
      setWatchlist(prev => [...prev, stock]);
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
      if (!input.trim()) return;

      // Add user's message to chat
      setMessages((prev) => [...prev, { type: "user", text: input }]);

      // Send request to your Gemini API endpoint
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
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: "Failed to get response from AI." },
        ]);
      }

      setInput(""); // Clear input
    };

  // ADD STOCK
  const addStock = async () => {
    if (!newSymbol.trim() || addStockMutation.isPending) return;
    const upper = newSymbol.toUpperCase();
    if (watchlist.find(s => s.symbol === upper)) return;
    
    setNewSymbol('');
    await addStockMutation.mutateAsync(upper);
  };


  // REMOVE STOCK
  const removeStock = async (id: string) => {
    const stock = watchlist.find(s => s.id === id);
    setWatchlist(watchlist.filter(s => s.id !== id));
    if (stock) {
      await removeStockMutation.mutateAsync(stock.symbol);
    }
  };

  // const removeStock = (id: string) => {
  //   setWatchlist(watchlist.filter(stock => stock.id !== id));
  // };


    const handleStockClick = (stock: Stock) => {
      // If clicking the same stock → reset to default TSLA
      if (selectedStock.symbol === stock.symbol) {
        setSymbol(stock.symbol);
        return;
      }

      // Otherwise behave normally
      setSymbol(stock.symbol);

      setSelectedStock({
        symbol: stock.symbol,
        name: `${stock.symbol} Company`,
        price: stock.price,
        priceChange: stock.change,
        changePercent: stock.changePercent,
        statistics: {
          'Open': `$${(stock.price - 5).toFixed(2)}`,
          'High': `$${(stock.price + 10).toFixed(2)}`,
          'Low': `$${(stock.price - 8).toFixed(2)}`,
          'Volume': `${(stock.price * 2).toFixed(1)}M`,
          'Avg Volume': `${(stock.price * 1.5).toFixed(1)}M`,
          'Market Cap': `$${(stock.price * 10).toFixed(1)}B`,
        },
        chartData: Array.from({ length: 50 }, (_, i) =>
          stock.price - 50 + (i * 2)
        ),
      });
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
          {watchlistLoading? ( <div className= "loading">Loading watchlist... </div> ):(
          watchlist.map((stock) => (
            <div
              key={stock.id}
              onClick={() => handleStockClick(stock)}
              className={`stock-card ${
                selectedStock.symbol === stock.symbol ? 'active-stock' : ''
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
          <div className="content-wrapper">
            {/* Header with AI Chat Icon */}
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

            {/* Chart Area */}
            <div className="chart-container">
              <svg width="100%" height="100%" className="chart-svg">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00FF09" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00FF09" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${300 - (selectedStock.chartData[0] - 150)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1000) / selectedStock.chartData.length},${300 - (point - 150)}`)
                    .join(' ')}`}
                  stroke="#00FF09"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M 0,${300 - (selectedStock.chartData[0] - 150)} ${selectedStock.chartData
                    .map((point, i) => `L ${(i * 1000) / selectedStock.chartData.length},${300 - (point - 150)}`)
                    .join(' ')} L 1000,300 L 0,300 Z`}
                  fill="url(#chartGradient)"
                />
              </svg>
              <div className="chart-timeline">
                2:00 • 4 Mar • 08:00 • 10:00 • 14:00 • 16:00 • 18:00
              </div>
            </div>

            {/* Statistics Table */}
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


          {showAIChat && (
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
                          Hello! I'm your AI stock analyst. Ask me anything about{" "}
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
