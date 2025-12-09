import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getUserById,
  getTransactionsByUserId,
  getBuyRequestsByUserId,
  updateUser,
  convertTimestamps
} from '@/lib/firestore-db';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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

    // Получение транзакций пользователя
    const transactions = await getTransactionsByUserId(session.user_id);
    
    // Получение активной заявки на покупку пользователя
    const allBuyRequests = await getBuyRequestsByUserId(session.user_id);
    const activeBuyRequest = allBuyRequests.find((request: any) => 
      ['pending', 'processing', 'paid'].includes(request.status)
    ) || null;

    // Конвертация timestamp'ов
    const convertedUser = convertTimestamps(user);
    const convertedTransactions = transactions.map((transaction: any) => convertTimestamps(transaction));
    const convertedActiveBuyRequest = activeBuyRequest ? convertTimestamps(activeBuyRequest) : null;

    return NextResponse.json(
      {
        user: convertedUser,
        transactions: convertedTransactions,
        activeBuyRequest: convertedActiveBuyRequest
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении данных профиля' },
      { status: 500 }
    );
  }
}

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

    // Получение данных формы
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файл слишком большой (максимум 2MB)' },
        { status: 400 }
      );
    }

    // Генерация уникального имени файла
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const extension = file.type.split('/')[1];
    const filename = `avatar_${session.user_id}_${timestamp}_${random}.${extension}`;
    
    // Преобразование файла в буфер
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Сохранение файла в public/avatars
    const filepath = join(process.cwd(), 'public', 'avatars', filename);
    
    // Создание директории, если она не существует
    const dir = join(process.cwd(), 'public', 'avatars');
    try {
      await writeFile(dir, '', { flag: 'wx' });
    } catch (err) {
      // Директория уже существует
    }
    
    // Сохранение файла
    await writeFile(filepath, buffer);
    
    // Обновление аватарки в базе данных
    const updatedUser = await updateUser(session.user_id, {
      avatar: `/avatars/${filename}`
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Аватар успешно обновлен',
        avatar: `/avatars/${filename}`,
        user: convertTimestamps(updatedUser)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при загрузке аватара' },
      { status: 500 }
    );
  }
}