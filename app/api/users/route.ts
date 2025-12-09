import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';

// Получение списка пользователей (только для администраторов)
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

    // Получение всех пользователей
    const users: any[] = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
        [],
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
      { users },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка пользователей' },
      { status: 500 }
    );
  }
}

// Обновление роли пользователя (только для администраторов)
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
    const adminUser: any = await new Promise((resolve, reject) => {
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
    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { userId, role } = await request.json();

    // Проверка обязательных полей
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ID пользователя и роль обязательны' },
        { status: 400 }
      );
    }

    // Проверка допустимых значений роли
    const validRoles = ['user', 'operator', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Недопустимая роль' },
        { status: 400 }
      );
    }

    // Проверка, что пользователь не пытается изменить свою собственную роль
    if (userId === adminUser.id && role !== adminUser.role) {
      return NextResponse.json(
        { error: 'Нельзя изменить свою собственную роль' },
        { status: 400 }
      );
    }

    // Обновление роли пользователя
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            // Если ни одна строка не была изменена, пользователь не найден
            reject(new Error('Пользователь не найден'));
          } else {
            resolve(null);
          }
        }
      );
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Роль пользователя успешно обновлена'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User role update error:', error);
    
    if (error.message === 'Пользователь не найден') {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении роли пользователя' },
      { status: 500 }
    );
  }
}