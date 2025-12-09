import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';

// Создание нового спора
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
    const { requestId, reason } = await request.json();

    // Проверка обязательных полей
    if (!requestId || !reason) {
      return NextResponse.json(
        { error: 'ID заявки и причина обязательны' },
        { status: 400 }
      );
    }

    // Проверка, что заявка принадлежит пользователю
    const requestDetails: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM buy_requests WHERE request_id = ?',
        [requestId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!requestDetails || requestDetails.user_id !== session.user_id) {
      return NextResponse.json(
        { error: 'Заявка не найдена или доступ запрещен' },
        { status: 403 }
      );
    }

    // Создание спора
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO disputes (request_id, user_id, reason) VALUES (?, ?, ?)',
        [requestId, session.user_id, reason],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        }
      );
    });

    // Обновление статуса заявки на "disputed"
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE buy_requests SET status = ? WHERE request_id = ?',
        ['disputed', requestId],
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
        message: 'Спор успешно создан'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Dispute creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании спора' },
      { status: 500 }
    );
  }
}

// Получение списка споров (для администраторов - все, для пользователей - только свои)
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

    let disputesQuery = '';
    let queryParams: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (session.user_role === 'admin') {
      // Для администраторов - все споры
      disputesQuery = 'SELECT d.*, br.crypto_type, br.amount, br.currency, u.username as user_username FROM disputes d JOIN buy_requests br ON d.request_id = br.request_id JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC';
    } else {
      // Для обычных пользователей - только их споры
      disputesQuery = 'SELECT d.*, br.crypto_type, br.amount, br.currency FROM disputes d JOIN buy_requests br ON d.request_id = br.request_id WHERE d.user_id = ? ORDER BY d.created_at DESC';
      queryParams = [session.user_id];
    }

    // Получение споров
    const disputes: any[] = await new Promise((resolve, reject) => {
      db.all(
        disputesQuery,
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
        disputes
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Disputes list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка споров' },
      { status: 500 }
    );
  }
}

// Обновление статуса спора (только для администраторов)
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
        'SELECT role FROM users WHERE id = ?',
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
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { disputeId, status } = await request.json();

    // Проверка обязательных полей
    if (!disputeId || !status) {
      return NextResponse.json(
        { error: 'ID спора и статус обязательны' },
        { status: 400 }
      );
    }

    // Проверка допустимых значений статуса
    const validStatuses = ['open', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      );
    }

    // Обновление статуса спора
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE disputes SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, disputeId],
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
        message: 'Статус спора успешно обновлен'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dispute update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении статуса спора' },
      { status: 500 }
    );
  }
}