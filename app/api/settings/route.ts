import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';

// Получение настроек (только для администраторов)
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

    // Проверка роли пользователя
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение настроек
    const settings: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM settings LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    return NextResponse.json(
      { settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings get error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении настроек' },
      { status: 500 }
    );
  }
}

// Обновление настроек (только для администраторов)
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
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { markupPercentage } = await request.json();

    // Проверка обязательных полей
    if (markupPercentage === undefined) {
      return NextResponse.json(
        { error: 'Процент наценки обязателен' },
        { status: 400 }
      );
    }

    // Проверка корректности значения
    const markup = parseFloat(markupPercentage);
    if (isNaN(markup) || markup < 0) {
      return NextResponse.json(
        { error: 'Некорректное значение процента наценки' },
        { status: 400 }
      );
    }

    // Обновление настроек
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE settings SET markup_percentage = ?, updated_at = CURRENT_TIMESTAMP',
        [markup],
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
        message: 'Настройки успешно обновлены'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении настроек' },
      { status: 500 }
    );
  }
}