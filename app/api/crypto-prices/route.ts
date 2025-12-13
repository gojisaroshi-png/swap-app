import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/firestore-db';

// Получение курсов криптовалют через CoinGecko
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency') || 'USD';
  try {
    // Определяем токены, для которых нужно получить курсы
    const tokens = [
      { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum' },
      { symbol: 'USDT', name: 'Tether', coinId: 'tether' },
      { symbol: 'SOL', name: 'Solana', coinId: 'solana' },
      { symbol: 'XMR', name: 'Monero', coinId: 'monero' },
      { symbol: 'ZEC', name: 'Zcash', coinId: 'zcash' },
      { symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin' },
      { symbol: 'BNB', name: 'Binance Coin', coinId: 'binancecoin' }
    ];
    
    
    const priceMap: Record<string, number> = {};
    
    // Получаем настройки (процент наценки) из Firestore
    const settings: any = await getSettings();
    const markupPercentage = settings?.markup_percentage || 1.0;
    
    // Получаем курсы фиатных валют к USD с CoinGecko
    const fiatResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=eur,rub,usd'
    );
    
    let fiatRates: Record<string, number> = {
      eur: 1.1, // Приблизительный курс EUR к USD
      rub: 0.011, // Приблизительный курс RUB к USD
      usd: 1
    };
    
    if (fiatResponse.ok) {
      const fiatData = await fiatResponse.json();
      // Обновляем курсы фиатных валют, если API вернул данные
      if (fiatData.usd) {
        fiatRates = {
          eur: fiatData.usd.eur || 1.1,
          rub: fiatData.usd.rub || 0.011,
          usd: 1
        };
      }
    }
    
    // Получаем курсы криптовалют с CoinGecko в выбранной валюте
    const coinIds = tokens.map(token => token.coinId).join(',');
    const cryptoResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${currency.toLowerCase()}`
    );
    
    if (cryptoResponse.ok) {
      const cryptoData = await cryptoResponse.json();
      
      // Обрабатываем каждый токен
      for (const token of tokens) {
        const price = cryptoData[token.coinId]?.[currency.toLowerCase()];
        
        if (price && price > 0) {
          // Применяем наценку
          priceMap[token.symbol] = price * markupPercentage;
          console.log(`CoinGecko Price for ${token.symbol}: ${price} ${currency} (with ${((markupPercentage - 1) * 100).toFixed(0)}% markup: ${(price * markupPercentage).toFixed(2)} ${currency})`);
        } else {
          // Используем запасные значения, если API не вернул корректные данные
          // Конвертируем запасные значения из USD в выбранную валюту
          const fallbackPricesUSD: Record<string, number> = {
            'BTC': 43000,
            'ETH': 2500,
            'USDT': 1,
            'SOL': 100,
            'XMR': 150,
            'ZEC': 25,
            'USDC': 1,
            'BNB': 300
          };
          
          // Конвертируем из USD в выбранную валюту
          const fallbackPriceUSD = fallbackPricesUSD[token.symbol] || 0;
          const convertedPrice = fallbackPriceUSD / fiatRates[currency.toLowerCase()];
          priceMap[token.symbol] = convertedPrice * markupPercentage;
          console.log(`Fallback price used for ${token.symbol}: ${priceMap[token.symbol]} ${currency}`);
        }
      }
    } else {
      // Используем запасные значения, если API вернул ошибку
      console.log('CoinGecko API error, using fallback prices');
      for (const token of tokens) {
        // Конвертируем запасные значения из USD в выбранную валюту
        const fallbackPricesUSD: Record<string, number> = {
          'BTC': 43000,
          'ETH': 2500,
          'USDT': 1,
          'SOL': 100,
          'XMR': 150,
          'ZEC': 25,
          'USDC': 1,
          'BNB': 300
        };
        
        // Конвертируем из USD в выбранную валюту
        const fallbackPriceUSD = fallbackPricesUSD[token.symbol] || 0;
        const convertedPrice = fallbackPriceUSD / fiatRates[currency.toLowerCase()];
        priceMap[token.symbol] = convertedPrice * markupPercentage;
        console.log(`Fallback price used for ${token.symbol} due to API error: ${priceMap[token.symbol]} ${currency}`);
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