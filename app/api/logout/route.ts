import { NextResponse } from 'next/server';
import { removeSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      // Удаление сессии из базы данных
      await removeSession(token);
    }

    // Возвращаем ответ с удалением cookie
    const response = new NextResponse(
      JSON.stringify({ success: true, message: 'Вы успешно вышли из системы' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
        }
      }
    );
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при выходе' },
      { status: 500 }
    );
  }
}