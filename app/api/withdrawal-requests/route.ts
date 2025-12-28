import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import {
  getAllWithdrawalRequests,
  getWithdrawalRequestsByUserId,
  createWithdrawalRequest,
  updateWithdrawalRequest,
  getUserById,
  convertTimestamps
} from '@/lib/firestore-db';

// Функция для валидации адресов криптокошельков
function isValidWalletAddress(address: string, cryptoType: string, network?: string): boolean {
  // Базовая валидация адреса (непустая строка)
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return false;
  }

  // Удаление пробелов в начале и конце
  const cleanAddress = address.trim();

  // Валидация в зависимости от типа криптовалюты и сети
  switch (cryptoType.toLowerCase()) {
    case 'btc':
    case 'bitcoin':
      // Базовая проверка для Bitcoin адресов (начинаются с 1, 3 или bc1)
      return /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})$/.test(cleanAddress);
    case 'eth':
    case 'ethereum':
      // Проверка Ethereum адреса (0x + 40 hex символов)
      return /^0x[a-fA-F0-9]{40}$/.test(cleanAddress);
    case 'sol':
    case 'solana':
      // Проверка Solana адреса (32-44 символа, base58)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanAddress);
    case 'usdt':
      // Для USDT проверка зависит от сети
      if (network === 'TRC-20') {
        // TRC-20 адреса (начинаются с T)
        return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(cleanAddress);
      } else if (network === 'SPL') {
        // SPL адреса (Solana)
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanAddress);
      } else if (network === 'BEP-20') {
        // BEP-20 адреса (Binance Smart Chain) - такие же как Ethereum
        return /^0x[a-fA-F0-9]{40}$/.test(cleanAddress);
      } else {
        // По умолчанию ERC-20 (Ethereum)
        return /^0x[a-fA-F0-9]{40}$/.test(cleanAddress);
      }
    case 'xmr':
    case 'monero':
      // Проверка Monero адреса (95 символов, начинается с 4)
      return /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(cleanAddress);
    case 'zec':
    case 'zcash':
      // Проверка Zcash адреса (t1, t3, zc или zs)
      return /^(t1|t3|zc|zs)[a-zA-Z0-9]{30,}$/.test(cleanAddress);
    default:
      // Для неизвестных типов криптовалют базовая проверка (непустая строка)
      return cleanAddress.length > 0;
  }
}

// Получение списка заявок на вывод (для администраторов - все, для пользователей - только свои)
export async function GET(request: Request) {
  try {
    // Получение токена из cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('token='));
    const tokenValue = token?.split('=')[1];

    if (!tokenValue) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Проверка сессии
    const session: any = await validateSession(tokenValue);
    if (!session) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      );
    }

    // Получение данных пользователя из сессии
    const user: any = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получение параметров запроса
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    let requests: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin' || user.role === 'operator') {
      // Для администраторов и операторов - все заявки
      requests = await getAllWithdrawalRequests();
    } else {
      // Для обычных пользователей - только их заявки
      requests = await getWithdrawalRequestsByUserId(session.user_id);
    }

    // Фильтрация по статусу, если указан
    if (statusFilter) {
      requests = requests.filter((request: any) => request.status === statusFilter);
    }

    // Конвертация timestamp'ов
    const convertedRequests = requests.map((request: any) => convertTimestamps(request));

    return NextResponse.json(
      {
        requests: convertedRequests,
        userRole: user.role
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Withdrawal requests list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка заявок на вывод' },
      { status: 500 }
    );
  }
}

// Создание новой заявки на вывод
export async function POST(request: Request) {
  try {
    // Получение токена из cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('token='));
    const tokenValue = token?.split('=')[1];

    if (!tokenValue) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Проверка сессии
    const session: any = await validateSession(tokenValue);
    if (!session) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      );
    }

    // Получение данных из тела запроса
    const { cryptoType, amount, walletAddress, network } = await request.json();

    // Проверка обязательных полей
    if (!cryptoType || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Валидация адреса криптокошелька
    if (!isValidWalletAddress(walletAddress, cryptoType, network)) {
      return NextResponse.json(
        { error: 'Некорректный адрес криптокошелька' },
        { status: 400 }
      );
    }

    // Проверка, что amount положительное число
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть положительным числом' },
        { status: 400 }
      );
    }

    // Создание новой заявки на вывод
    const newRequest = await createWithdrawalRequest({
      user_id: session.user_id,
      crypto_type: cryptoType,
      amount: parseFloat(amount),
      wallet_address: walletAddress,
      network: network // Добавляем сеть в данные заявки
    });
    
    // Списание средств с баланса пользователя
    const { updateUserBalance } = await import('@/lib/firestore-db');
    await updateUserBalance(session.user_id, cryptoType, -parseFloat(amount));

    return NextResponse.json(
      { 
        success: true,
        message: 'Заявка на вывод успешно создана',
        requestId: newRequest.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Withdrawal request creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании заявки на вывод' },
      { status: 500 }
    );
  }
}

// Обновление статуса заявки на вывод (только для администраторов)
export async function PUT(request: Request) {
  try {
    // Получение токена из cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('token='));
    const tokenValue = token?.split('=')[1];

    if (!tokenValue) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Проверка сессии
    const session: any = await validateSession(tokenValue);
    if (!session) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      );
    }

    // Получение данных пользователя из сессии
    const user: any = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя
    if (user.role !== 'admin' && user.role !== 'operator') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { requestId, status } = await request.json();

    // Проверка обязательных полей
    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'ID заявки и статус обязательны' },
        { status: 400 }
      );
    }

    // Проверка допустимых значений статуса
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      );
    }

    // Обновление статуса заявки
    const updatedRequest = await updateWithdrawalRequest(requestId, { status });

    return NextResponse.json(
      {
        success: true,
        message: 'Статус заявки на вывод успешно обновлен',
        request: convertTimestamps(updatedRequest)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Withdrawal request update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении статуса заявки на вывод' },
      { status: 500 }
    );
  }
}