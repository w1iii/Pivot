"use client"

import React, { useState } from 'react';
import { Search, X, MessageCircle, User, TrendingUp, TrendingDown } from 'lucide-react';
import './page.css';

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

  const [selectedStock, setSelectedStock] = useState<StockDetail>({
    symbol: 'TSLA',
    name: 'Tesla, inc.',
    price: 255.30,
    priceChange: 6.35,
    changePercent: 2.55,
    marketCap: '$800B',
    tradingView: 'Buy',
    statistics: {
      'Open': '$248.95',
      'High': '$257.20',
      'Low': '$246.80',
      'Volume': '125.4M',
      'Avg Volume': '110.2M',
      'Market Cap': '$800.5B',
      'P/E Ratio': '65.32',
      '52 Week High': '$299.29',
      '52 Week Low': '$101.81',
      'Dividend Yield': 'N/A',
      'Beta': '2.01',
      'EPS': '3.91',
    },
    chartData: Array.from({ length: 50 }, (_, i) => 200 + Math.random() * 100),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);

  const removeStock = (id: string) => {
    setWatchlist(watchlist.filter(stock => stock.id !== id));
  };

  const handleStockClick = (stock: Stock) => {
    // In a real app, this would fetch detailed stock data from an API
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
        'P/E Ratio': (Math.random() * 100).toFixed(2),
        '52 Week High': `$${(stock.price + 50).toFixed(2)}`,
        '52 Week Low': `$${(stock.price - 100).toFixed(2)}`,
        'Dividend Yield': `${(Math.random() * 3).toFixed(2)}%`,
        'Beta': (Math.random() * 3).toFixed(2),
        'EPS': (Math.random() * 10).toFixed(2),
      },
      chartData: Array.from({ length: 50 }, (_, i) => stock.price - 50 + Math.random() * 100),
    });
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
          <button className="user-button">
            <User size={24} />
          </button>
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
