export interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  changePercent: number;
  statistics: { [key: string]: string | number };
  chartData: number[];
}

export const LOGO_COLORS = [
  'bg-primary',
  'bg-secondary-container',
  'bg-surface-container-highest',
  'bg-tertiary-container',
  'bg-error-container',
  'bg-secondary',
];

export function getLogoColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

export const COMPANY_NAMES: Record<string, string> = {
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

export function buildStockDetail(symbol: string, data: Record<string, string>): StockDetail {
  const avgVol = data.avgVolume
    ? `${(parseFloat(data.avgVolume) / 1_000_000).toFixed(2)}M`
    : 'N/A';
  const mktCap = data.marketCap
    ? `$${(parseFloat(data.marketCap) / 1_000_000_000).toFixed(2)}B`
    : 'N/A';

  return {
    symbol,
    name: COMPANY_NAMES[symbol] || symbol,
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
    chartData: [],
  };
}

export interface StockOverview {
  analystTargetPrice: number;
  analystRating: string;
  percentInstitutions: number;
  analystCount: number;
}
