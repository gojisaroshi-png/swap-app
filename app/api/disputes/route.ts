import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  createDispute as createFirestoreDispute,
  getAllDisputes,
  getDisputesByUserId,
  updateDispute,
  getBuyRequestByRequestId,
  updateBuyRequest,
  getUserById,
  convertTimestamps
} from '@/lib/firestore-db';

// Создание нового спора
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

    // Получение данных из тела запроса
    const { requestId, reason } = await request.json();

    // Проверка обязательных полей
    if (!requestId || !reason) {
      return NextResponse.json(
        { error: 'ID заявки и причина обязательны' },
        { status: 400 }
      );
    }

    // Проверка, что заявка принадлежит пользователю
    const requestDetails: any = await getBuyRequestByRequestId(requestId);
    if (!requestDetails || requestDetails.user_id !== session.user_id) {
      return NextResponse.json(
        { error: 'Заявка не найдена или доступ запрещен' },
        { status: 403 }
      );
    }

    // Создание спора
    const newDispute = await createFirestoreDispute({
      request_id: requestId,
      user_id: session.user_id,
      reason: reason,
      status: 'open'
    });

    // Обновление статуса заявки на "disputed"
    await updateBuyRequest(requestDetails.id, { status: 'disputed' });

    return NextResponse.json(
      { 
        success: true,
        message: 'Спор успешно создан',
        dispute: convertTimestamps(newDispute)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Dispute creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании спора' },
      { status: 500 }
    );
  }
}

// Получение списка споров (для администраторов - все, для пользователей - только свои)
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

    let disputes: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin') {
      // Для администраторов - все споры
      disputes = await getAllDisputes();
      // Добавляем информацию о заявке и пользователе
      const disputesWithDetails = await Promise.all(disputes.map(async (dispute: any) => {
        const requestDetails: any = await getBuyRequestByRequestId(dispute.request_id);
        const userDetails: any = await getUserById(dispute.user_id);
        return {
          ...dispute,
          crypto_type: requestDetails?.crypto_type || '',
          amount: requestDetails?.amount || 0,
          currency: requestDetails?.currency || '',
          user_username: userDetails?.username || ''
        };
      }));
      disputes = disputesWithDetails;
    } else {
      // Для обычных пользователей - только их споры
      disputes = await getDisputesByUserId(session.user_id);
      // Добавляем информацию о заявке
      const disputesWithRequestDetails = await Promise.all(disputes.map(async (dispute: any) => {
        const requestDetails: any = await getBuyRequestByRequestId(dispute.request_id);
        return {
          ...dispute,
          crypto_type: requestDetails?.crypto_type || '',
          amount: requestDetails?.amount || 0,
          currency: requestDetails?.currency || ''
        };
      }));
      disputes = disputesWithRequestDetails;
    }

    // Конвертация timestamp'ов
    const convertedDisputes = disputes.map((dispute: any) => convertTimestamps(dispute));

    return NextResponse.json(
      { 
        disputes: convertedDisputes
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Disputes list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка споров' },
      { status: 500 }
    );
  }
}

// Обновление статуса спора (только для администраторов)
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
    const { disputeId, status } = await request.json();

    // Проверка обязательных полей
    if (!disputeId || !status) {
      return NextResponse.json(
        { error: 'ID спора и статус обязательны' },
        { status: 400 }
      );
    }

    // Проверка допустимых значений статуса
    const validStatuses = ['open', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      );
    }

    // Обновление статуса спора
    const updatedDispute = await updateDispute(disputeId, { status });

    return NextResponse.json(
      { 
        success: true,
        message: 'Статус спора успешно обновлен',
        dispute: convertTimestamps(updatedDispute)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dispute update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении статуса спора' },
      { status: 500 }
    );
  }
}