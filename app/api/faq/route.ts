import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getAllFAQItems,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  getUserById,
  convertTimestamps
} from '@/lib/firestore-db';

// Получение списка FAQ (для всех пользователей)
export async function GET(request: Request) {
  try {
    // Получение всех FAQ элементов
    const faqItems = await getAllFAQItems();
    
    // Конвертация timestamp'ов
    const convertedFAQItems = faqItems.map((item: any) => convertTimestamps(item));
    
    return NextResponse.json(
      { 
        faq: convertedFAQItems
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('FAQ list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка FAQ' },
      { status: 500 }
    );
  }
}

// Создание нового FAQ элемента (только для администраторов)
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

    // Получение данных пользователя из сессии
    const user: any = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { question, answer } = await request.json();

    // Проверка обязательных полей
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Вопрос и ответ обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Создание нового FAQ элемента
    const newFAQItem = await createFAQItem({
      question,
      answer
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'FAQ элемент успешно создан',
        faqItem: convertTimestamps(newFAQItem)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('FAQ creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании FAQ элемента' },
      { status: 500 }
    );
  }
}

// Обновление FAQ элемента (только для администраторов)
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
    const user: any = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { id, question, answer } = await request.json();

    // Проверка обязательных полей
    if (!id || !question || !answer) {
      return NextResponse.json(
        { error: 'ID, вопрос и ответ обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Обновление FAQ элемента
    const updatedFAQItem = await updateFAQItem(id, {
      question,
      answer
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'FAQ элемент успешно обновлен',
        faqItem: convertTimestamps(updatedFAQItem)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('FAQ update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении FAQ элемента' },
      { status: 500 }
    );
  }
}

// Удаление FAQ элемента (только для администраторов)
export async function DELETE(request: Request) {
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
    const user: any = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получение данных из тела запроса
    const { id } = await request.json();

    // Проверка обязательных полей
    if (!id) {
      return NextResponse.json(
        { error: 'ID обязателен для удаления' },
        { status: 400 }
      );
    }

    // Удаление FAQ элемента
    await deleteFAQItem(id);

    return NextResponse.json(
      { 
        success: true,
        message: 'FAQ элемент успешно удален'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('FAQ deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при удалении FAQ элемента' },
      { status: 500 }
    );
  }
}