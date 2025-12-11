import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/firestore-db';

// Получение курсов криптовалют через CoinGecko
export async function GET() {
  try {
    // Определяем токены, для которых нужно получить курсы
    const tokens = [
      { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum' },
      { symbol: 'USDT', name: 'Tether', coinId: 'tether' },
      { symbol: 'SOL', name: 'Solana', coinId: 'solana' },
      { symbol: 'XMR', name: 'Monero', coinId: 'monero' },
      { symbol: 'ZEC', name: 'Zcash', coinId: 'zcash' },
      { symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin' }
    ];
    
    
    const priceMap: Record<string, number> = {};
    
    // Получаем настройки (процент наценки) из Firestore
    const settings: any = await getSettings();
    const markupPercentage = settings?.markup_percentage || 1.0;
    
    // Получаем курсы с CoinGecko
    const coinIds = tokens.map(token => token.coinId).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Обрабатываем каждый токен
      for (const token of tokens) {
        const price = data[token.coinId]?.usd;
        
        if (price && price > 0) {
          // Применяем наценку
          priceMap[token.symbol] = price * markupPercentage;
          console.log(`CoinGecko Price for ${token.symbol}: $${price} (with ${((markupPercentage - 1) * 100).toFixed(0)}% markup: $${(price * markupPercentage).toFixed(2)})`);
        } else {
          // Используем запасные значения, если API не вернул корректные данные
          const fallbackPrices: Record<string, number> = {
            'BTC': 43000,
            'ETH': 2500,
            'USDT': 1,
            'SOL': 100,
            'XMR': 150,
            'ZEC': 25,
            'USDC': 1
          };
          priceMap[token.symbol] = (fallbackPrices[token.symbol] || 0) * markupPercentage;
          console.log(`Fallback price used for ${token.symbol}: ${priceMap[token.symbol]}`);
        }
      }
    } else {
      // Используем запасные значения, если API вернул ошибку
      console.log('CoinGecko API error, using fallback prices');
      for (const token of tokens) {
        const fallbackPrices: Record<string, number> = {
          'BTC': 43000,
          'ETH': 2500,
          'USDT': 1,
          'SOL': 100,
          'XMR': 150,
          'ZEC': 25,
          'USDC': 1
        };
        priceMap[token.symbol] = (fallbackPrices[token.symbol] || 0) * markupPercentage;
        console.log(`Fallback price used for ${token.symbol} due to API error: ${priceMap[token.symbol]}`);
      }
    }
    
    return NextResponse.json({ prices: priceMap }, { status: 200 });
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении курсов криптовалют' },
      { status: 500 }
    );
  }
}