"use client"

import React, { useState, useEffect } from 'react';
import { Search, X, MessageCircle, User, TrendingUp, TrendingDown } from 'lucide-react';
import './page.css';
import { useRouter } from 'next/navigation'

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
  const [watchlist, setWatchlist] = useState<Stock[]>([
    { id: '1', symbol: 'TSLA', price: 255.30, change: 6.35, changePercent: 2.55 },
    { id: '2', symbol: 'AAPL', price: 255.30, change: -0.75, changePercent: -0.75 },
    { id: '3', symbol: 'GOOGL', price: 255.30, change: 2.55, changePercent: 2.55 },
    { id: '4', symbol: 'AMAZN', price: 255.30, change: 2.55, changePercent: 2.55 },
  ]);
  
  const [symbol, setSymbol] = useState('TSLA');
  const [open, setOpen] = useState(0);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);
  const [volume, setVolume] = useState(0);
  const [avgvolume, setAvg] = useState(0);
  const [marketcap, setMarketcap] = useState(0);
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');

  const router = useRouter()


  // Fetch stock data when symbol changes
  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch(`../api/stock?symbol=${symbol}`);

        if (!res.ok) {
          throw new Error('server error');
        }

        const data = await res.json();
        console.log('Fetched data:', data);
        
        // Update state with fetched data
        setOpen(parseFloat(data.open) || 0);
        setHigh(parseFloat(data.high) || 0);
        setLow(parseFloat(data.low) || 0);
        setPrice(parseFloat(data.price) || 0);
        setVolume(parseFloat(data.volume) || 0);
        setChange(parseFloat(data.change) || 0);
        setPercent(parseFloat(data.changePercent) || 0);
        
        // Update selected stock with real data
        setSelectedStock(prev => ({
          ...prev,
          symbol: symbol,
          price: parseFloat(data.price) || prev.price,
          priceChange: parseFloat(data.change) || prev.priceChange,
          changePercent: parseFloat(data.changePercent) || prev.changePercent,
          statistics: {
            'Open': parseFloat(data.open)?.toFixed(2) || '0.00',
            'High': parseFloat(data.high)?.toFixed(2) || '0.00',
            'Low': parseFloat(data.low)?.toFixed(2) || '0.00',
            'Volume': data.volume ? `${(parseFloat(data.volume) / 1000000).toFixed(2)}M` : '0',
            'Avg Volume': prev.statistics['Avg Volume'],
            'Market Cap': prev.statistics['Market Cap'],
          }
        }));

      } catch (e) {
        console.error('Fetch error:', e);
        setError('server error');
      }
    }

    fetchStock();
  }, [symbol]); // Add symbol as dependency to refetch when it changes

  const [selectedStock, setSelectedStock] = useState<StockDetail>({
    symbol: 'TSLA',
    name: 'Tesla, inc.',
    price: 255.30, // Default value
    priceChange: 2.55, // Default value
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
    chartData: Array.from({ length: 50 }, (_, i) => 200 + Math.random() * 100),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDropdown, setShow] = useState(false);

  const removeStock = (id: string) => {
    setWatchlist(watchlist.filter(stock => stock.id !== id));
  };

  const handleStockClick = (stock: Stock) => {
    // Update symbol to trigger data fetch
    console.log(stock)
    setSymbol(stock.symbol);
    
    // Update selected stock with basic info
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
        'Volume': `${(Math.random() * 200).toFixed(1)}M`,
        'Avg Volume': `${(Math.random() * 150).toFixed(1)}M`,
        'Market Cap': `$${(Math.random() * 1000).toFixed(1)}B`,
      },
      chartData: Array.from({ length: 50 }, (_, i) => stock.price - 50 + Math.random() * 100),
    });
  };

   const handleLogout = async () => {
      try {
        // Call logout API to clear cookies
        const response = await fetch('../api/logout', {
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
            <div className="search-container">
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Search className="search-icon" size={20} />
            </div>
          </div>
          <div className="dropdown-container">
            <button className="user-button" onClick={handleIconClick}>
              <User size={24} />
            </button>

          { showDropdown && 
            <div className="user-dropdown"> 
              <div className="dropdown-items">
                <li className="item-dropdown" >username</li>
                <li className="item-dropdown" >settings</li>
                <li className="item-dropdown" onClick={handleLogout}>logout</li>
              </div>
            </div>
          }
        </div>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {watchlist.map((stock) => (
            <div
              key={stock.id}
              onClick={() => handleStockClick(stock)}
              className="stock-card"
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

          {/* AI Chat Modal/Panel (Placeholder) */}
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
                <div className="ai-message">
                  <p>
                    Hello! I'm your AI stock analyst. Ask me anything about {selectedStock.symbol}.
                  </p>
                </div>
                <p className="ai-placeholder-text">
                  Connect your AI API key to enable real-time analysis
                </p>
              </div>
              <div className="ai-chat-input-container">
                <input
                  type="text"
                  placeholder="Ask about this stock..."
                  className="ai-chat-input"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StockDashboard;
