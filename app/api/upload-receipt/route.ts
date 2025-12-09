import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

// Обработчик POST запроса для загрузки чека
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
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Недопустимый тип файла. Разрешены: JPG, PNG, GIF, PDF' },
        { status: 400 }
      );
    }

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер 5MB' },
        { status: 400 }
      );
    }

    // Создание директории для загрузок, если она не существует
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Генерация уникального имени файла
    const fileExtension = path.extname(file.name);
    const fileName = `${session.user_id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Сохранение файла
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Возвращаем URL файла
    const fileUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Receipt upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при загрузке чека' },
      { status: 500 }
    );
  }
}

// Отключаем автоматический body parsing для работы с FormData
export const dynamic = 'force-dynamic';