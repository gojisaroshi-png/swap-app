import { NextResponse } from 'next/server';
import { verifyPassword, generateToken, createSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Проверка обязательных полей
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    // Поиск пользователя в базе данных
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    // Генерация токена
    const token = generateToken(user);

    // Создание сессии в базе данных
    await createSession(user.id, token);

    // Возвращаем успешный ответ с токеном
    return NextResponse.json(
      { 
        success: true, 
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при входе' },
      { status: 500 }
    );
  }
}