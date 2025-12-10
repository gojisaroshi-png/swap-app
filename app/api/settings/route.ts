import { NextResponse } from 'next/server';
import { validateSession, getCurrentUser } from '@/lib/auth';
import { getSettings, updateSettings, getUserById } from '@/lib/firestore-db';

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

    // Получение данных пользователя из Firestore
    const user: any = await getUserById(session.user_id);

    // Проверка роли пользователя
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение настроек из Firestore
    const settings: any = await getSettings();

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

    // Получение данных пользователя из Firestore
    const user: any = await getUserById(session.user_id);

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

    // Обновление настроек в Firestore
    await updateSettings({ markup_percentage: markup });

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