import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

// Обработчик POST запроса для сохранения ссылки на чек
export async function POST(request: Request) {
  try {
    // Получение токена из cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';').find(c => c.trim().startsWith('token='));
    const tokenValue = token?.split('=')[1];

    // Проверка наличия токена
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

    // Получение данных из формы
    const formData = await request.formData();
    const receiptUrl = formData.get('receipt') as string | null;

    if (!receiptUrl) {
      return NextResponse.json(
        { error: 'Ссылка не найдена' },
        { status: 400 }
      );
    }

    // Проверка, что это действительный URL
    try {
      new URL(receiptUrl);
    } catch {
      return NextResponse.json(
        { error: 'Недействительная ссылка' },
        { status: 400 }
      );
    }

    // Возвращаем URL как есть
    return NextResponse.json({ url: receiptUrl });
  } catch (error) {
    console.error('Receipt URL error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обработке ссылки' },
      { status: 500 }
    );
  }
}

// Отключаем автоматический body parsing для работы с FormData
export const dynamic = 'force-dynamic';