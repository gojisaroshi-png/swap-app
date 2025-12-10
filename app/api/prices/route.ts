import { NextResponse } from 'next/server';
import { SIMPLESWAP_API_KEY } from '@/lib/config';
import { getSettings } from '@/lib/firestore-db';

// Получение курсов криптовалют
export async function GET() {
  try {
    // Определяем токены, для которых нужно получить курсы
    const tokens = [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'USDT', name: 'Tether' },
      { symbol: 'BNB', name: 'BNB' },
      { symbol: 'SOL', name: 'Solana' },
      { symbol: 'XMR', name: 'Monero' },
      { symbol: 'ZEC', name: 'Zcash' },
      { symbol: 'USDC', name: 'USD Coin' }
    ];
    
    const priceMap: Record<string, number> = {};
    
    // Получаем настройки (процент наценки) из Firestore
    const settings: any = await getSettings();
    const markupPercentage = settings?.markup_percentage || 1.0;
    
    // Получаем курсы для каждого токена относительно USD
    for (const token of tokens) {
      try {
        const response = await fetch(
          `https://api.simpleswap.io/v3/estimates?api_key=${SIMPLESWAP_API_KEY}&amount=1&tickerFrom=usdc&tickerTo=${token.symbol.toLowerCase()}&networkFrom=sol&networkTo=${getNetwork(token.symbol)}`,
          {
            headers: {
              'X-API-KEY': SIMPLESWAP_API_KEY
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const price = parseFloat(data.result?.estimatedAmount || 0);
          if (!isNaN(price) && price > 0) {
            // Применяем наценку
            priceMap[token.symbol] = price * markupPercentage;
          } else {
            // Используем запасные значения, если API не вернул корректные данные
            const fallbackPrices: Record<string, number> = {
              'BTC': 43000,
              'ETH': 2500,
              'USDT': 1,
              'BNB': 300,
              'SOL': 100,
              'XMR': 150,
              'ZEC': 25,
              'USDC': 1
            };
            priceMap[token.symbol] = (fallbackPrices[token.symbol] || 0) * markupPercentage;
          }
        } else {
          // Используем запасные значения, если API вернул ошибку
          const fallbackPrices: Record<string, number> = {
            'BTC': 43000,
            'ETH': 2500,
            'USDT': 1,
            'BNB': 300,
            'SOL': 100,
            'XMR': 150,
            'ZEC': 25,
            'USDC': 1
          };
          priceMap[token.symbol] = (fallbackPrices[token.symbol] || 0) * markupPercentage;
        }
      } catch (error) {
        console.error(`Error fetching price for ${token.symbol}:`, error);
        // Используем запасные значения, если произошла ошибка
        const fallbackPrices: Record<string, number> = {
          'BTC': 43000,
          'ETH': 2500,
          'USDT': 1,
          'BNB': 300,
          'SOL': 100,
          'XMR': 150,
          'ZEC': 25,
          'USDC': 1
        };
        priceMap[token.symbol] = (fallbackPrices[token.symbol] || 0) * markupPercentage;
      }
    }
    
    return NextResponse.json({ prices: priceMap }, { status: 200 });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении курсов криптовалют' },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для определения сети токена
function getNetwork(tokenSymbol: string) {
  switch (tokenSymbol.toLowerCase()) {
    case 'usdc':
      return 'sol';
    case 'zec':
      return 'zec';
    case 'xmr':
      return 'xmr';
    case 'sol':
      return 'sol';
    case 'btc':
      return 'btc';
    case 'eth':
      return 'eth';
    case 'usdt':
      return 'eth';
    case 'bnb':
      return 'bsc';
    default:
      return 'eth';
  }
}