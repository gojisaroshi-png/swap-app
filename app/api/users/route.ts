import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getUserById,
  getAllUsers, 
  updateUserRole,
  convertTimestamps
} from '@/lib/firestore-db';

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

    // Получение всех пользователей
    const users = await getAllUsers();
    
    // Конвертация timestamp'ов
    const usersWithConvertedDates = users.map((user: any) => convertTimestamps(user));

    return NextResponse.json(
      { users: usersWithConvertedDates },
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
    const updatedUser = await updateUserRole(userId, { role });

    return NextResponse.json(
      { 
        success: true,
        message: 'Роль пользователя успешно обновлена',
        user: convertTimestamps(updatedUser)
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