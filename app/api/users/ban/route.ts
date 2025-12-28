import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getUserById,
  banUser,
  convertTimestamps
} from '@/lib/firestore-db';

// Бан/разбан пользователя (только для администраторов)
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
    const adminUser: any = await getUserById(session.user_id);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя
    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { userId, isBanned } = await request.json();

    // Проверка обязательных полей
    if (userId === undefined || isBanned === undefined) {
      return NextResponse.json(
        { error: 'ID пользователя и статус бана обязательны' },
        { status: 400 }
      );
    }

    // Проверка, что пользователь не пытается забанить самого себя
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'Нельзя забанить самого себя' },
        { status: 400 }
      );
    }

    // Бан/разбан пользователя
    const updatedUser = await banUser(userId, isBanned);

    return NextResponse.json(
      { 
        success: true,
        message: isBanned ? 'Пользователь забанен' : 'Пользователь разбанен',
        user: convertTimestamps(updatedUser)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User ban error:', error);
    
    if (error.message === 'Пользователь не найден') {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка сервера при бане пользователя' },
      { status: 500 }
    );
  }
}