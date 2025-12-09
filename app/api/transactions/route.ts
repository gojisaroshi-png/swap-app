import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getAllTransactions,
  getTransactionsByUserId,
  updateTransaction,
  getUserById,
  convertTimestamps
} from '@/lib/firestore-db';

// Получение списка транзакций (для администраторов - все, для операторов - только ожидающие)
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

    let transactions: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin') {
      // Для администраторов - все транзакции
      transactions = await getAllTransactions();
    } else if (user.role === 'operator') {
      // Для операторов - только ожидающие транзакции
      const allTransactions = await getAllTransactions();
      transactions = allTransactions.filter((transaction: any) => transaction.status === 'pending');
    } else {
      // Для обычных пользователей - только их транзакции
      transactions = await getTransactionsByUserId(session.user_id);
    }

    // Конвертация timestamp'ов
    const convertedTransactions = transactions.map((transaction: any) => convertTimestamps(transaction));

    return NextResponse.json(
      { 
        transactions: convertedTransactions,
        userRole: user.role
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Transactions list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка транзакций' },
      { status: 500 }
    );
  }
}

// Обновление статуса транзакции (только для операторов и администраторов)
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
    const { transactionId, status } = await request.json();

    // Проверка обязательных полей
    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'ID транзакции и статус обязательны' },
        { status: 400 }
      );
    }

    // Проверка допустимых значений статуса
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      );
    }

    // Обновление статуса транзакции
    const updatedTransaction = await updateTransaction(transactionId, { status });

    return NextResponse.json(
      { 
        success: true,
        message: 'Статус транзакции успешно обновлен',
        transaction: convertTimestamps(updatedTransaction)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении статуса транзакции' },
      { status: 500 }
    );
  }
}