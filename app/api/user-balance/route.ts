import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getUserById,
  getUserBalance,
  convertTimestamps
} from '@/lib/firestore-db';

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

    // Получение данных пользователя
    const user: any = await getUserById(session.user_id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получение баланса пользователя
    const balance = await getUserBalance(session.user_id);

    return NextResponse.json(
      {
        balance: convertTimestamps(balance)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User balance error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении баланса пользователя' },
      { status: 500 }
    );
  }
}