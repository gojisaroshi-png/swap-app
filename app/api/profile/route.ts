import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';

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
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?',
        [session.user_id],
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
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получение транзакций пользователя
    const transactions: any[] = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, exchange_id, from_currency, to_currency, amount_from, amount_to, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
        [session.user_id],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });

    // Получение активной заявки на покупку пользователя
    const activeBuyRequest: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM buy_requests WHERE user_id = ? AND status IN (?, ?, ?) ORDER BY created_at DESC LIMIT 1',
        [session.user_id, 'pending', 'processing', 'paid'],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });

    return NextResponse.json(
      {
        user,
        transactions,
        activeBuyRequest
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
    const fs = await import('fs');
    const path = await import('path');
    
    const filepath = path.join(process.cwd(), 'public', 'avatars', filename);
    
    // Создание директории, если она не существует
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Сохранение файла
    fs.writeFileSync(filepath, buffer);
    
    // Обновление аватарки в базе данных
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [`/avatars/${filename}`, session.user_id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        }
      );
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Аватар успешно обновлен',
        avatar: `/avatars/${filename}`
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