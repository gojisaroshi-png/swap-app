import { NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getUserByUsername, createSession } from '@/lib/firestore-db';

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

    // Поиск пользователя в Firestore
    const user: any = await getUserByUsername(username);
    
    if (!user) {
      // Проверяем также по email
      // В Firestore можно добавить индекс для email, если это будет часто использоваться
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    // Проверка, не забанен ли пользователь
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Пользователь забанен' },
        { status: 403 }
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
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Создание сессии в Firestore
    await createSession({
      user_id: user.id,
      token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
    });

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