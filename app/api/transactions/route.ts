import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';

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
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [session.user_id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    let transactionsQuery = '';
    let queryParams: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin') {
      // Для администраторов - все транзакции
      transactionsQuery = 'SELECT t.id, t.user_id, u.username, t.exchange_id, t.from_currency, t.to_currency, t.amount_from, t.amount_to, t.status, t.created_at FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC';
    } else if (user.role === 'operator') {
      // Для операторов - только ожидающие транзакции
      transactionsQuery = 'SELECT t.id, t.user_id, u.username, t.exchange_id, t.from_currency, t.to_currency, t.amount_from, t.amount_to, t.status, t.created_at FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.status = ? ORDER BY t.created_at DESC';
      queryParams = ['pending'];
    } else {
      // Для обычных пользователей - только их транзакции
      transactionsQuery = 'SELECT id, exchange_id, from_currency, to_currency, amount_from, amount_to, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC';
      queryParams = [session.user_id];
    }

    // Получение транзакций
    const transactions: any[] = await new Promise((resolve, reject) => {
      db.all(
        transactionsQuery,
        queryParams,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });

    return NextResponse.json(
      { 
        transactions,
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
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [session.user_id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

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
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, transactionId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        }
      );
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Статус транзакции успешно обновлен'
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