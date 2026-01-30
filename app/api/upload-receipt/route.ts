import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getBuyRequestByRequestId, updateBuyRequest } from '@/lib/firestore-db';
import { sendTelegramNotification } from '@/lib/telegram-notifier';
import axios from 'axios';

// Обработчик POST запроса для загрузки изображения чека через ImgBB API
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
    const file = formData.get('file') as File | null;
    const requestId = formData.get('requestId') as string;

    if (!file || !requestId) {
      return NextResponse.json(
        { error: 'Файл и ID заявки обязательны' },
        { status: 400 }
      );
    }

    // Проверка типа файла (должен быть изображением)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверка размера файла (не более 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5 МБ' },
        { status: 400 }
      );
    }

    // Преобразование File в Buffer для отправки в API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загрузка файла в ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', buffer.toString('base64'));

    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=31697fe7b575ad25f004447808f57bbf`,
      imgbbFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Получение URL изображения
    const imageUrl = imgbbResponse.data.data.url;

    // Обновление заявки с URL изображения чека
    const requestDetails: any = await getBuyRequestByRequestId(requestId);
    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    // Проверка, что пользователь является владельцем заявки
    if (requestDetails.user_id !== session.user_id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Обновление заявки с URL изображения чека
    await updateBuyRequest(requestDetails.id, {
      receipt_image: imageUrl,
      status: 'paid'
    });

    // Отправка уведомления в Telegram
    const notificationMessage = `Пользователь ${session.user_id} загрузил чек для заявки #${requestId}`;
    await sendTelegramNotification(notificationMessage);

    // Возвращаем URL файла
    return NextResponse.json({ url: imageUrl });
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