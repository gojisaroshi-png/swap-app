import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getAllBuyRequests,
  getBuyRequestsByUserId,
  getBuyRequestByRequestId,
  createBuyRequest as createFirestoreBuyRequest,
  updateBuyRequest,
  getUserById,
  convertTimestamps
} from '@/lib/firestore-db';

// Получение списка заявок (для администраторов - все, для операторов - только ожидающие, для пользователей - только свои)
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

    let requests: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin') {
      // Для администраторов - все заявки
      requests = await getAllBuyRequests();
    } else if (user.role === 'operator') {
      // Для операторов - только ожидающие заявки
      const allRequests = await getAllBuyRequests();
      requests = allRequests.filter((request: any) => request.status === 'pending');
    } else {
      // Для обычных пользователей - только их заявки
      requests = await getBuyRequestsByUserId(session.user_id);
    }

    // Конвертация timestamp'ов
    const convertedRequests = requests.map((request: any) => convertTimestamps(request));

    return NextResponse.json(
      { 
        requests: convertedRequests,
        userRole: user.role
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Buy requests list error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении списка заявок' },
      { status: 500 }
    );
  }
}

// Создание новой заявки на покупку
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
    const { cryptoType, amount, currency, paymentMethod, walletAddress } = await request.json();

    // Проверка обязательных полей
    if (!cryptoType || !amount || !currency || !paymentMethod || !walletAddress) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверка, есть ли у пользователя активные заявки
    const userRequests = await getBuyRequestsByUserId(session.user_id);
    const activeRequest = userRequests.find((request: any) => 
      ['pending', 'processing'].includes(request.status)
    );

    if (activeRequest) {
      return NextResponse.json(
        { error: 'У вас уже есть активная заявка. Дождитесь её завершения.' },
        { status: 400 }
      );
    }

    // Создание новой заявки
    const newRequest = await createFirestoreBuyRequest({
      user_id: session.user_id,
      crypto_type: cryptoType,
      amount: parseFloat(amount),
      currency,
      payment_method: paymentMethod,
      wallet_address: walletAddress,
      status: 'pending'
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Заявка на покупку успешно создана',
        requestId: newRequest.request_id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Buy request creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании заявки на покупку' },
      { status: 500 }
    );
  }
}

// Обновление статуса заявки (только для операторов и администраторов)
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
    let requestId, status, paymentDetails, receiptImage, transactionHash;
    
    if (user.role !== 'admin' && user.role !== 'operator') {
      // Если пользователь не оператор/админ, проверяем может ли он обновлять заявку
      // Разрешаем обновление статуса на 'paid' и 'completed' обычным пользователям
      const body = await request.json();
      status = body.status;
      
      if (status !== 'paid' && status !== 'completed') {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
      
      // Для обычных пользователей получаем requestId из тела запроса
      requestId = body.requestId;
      receiptImage = body.receiptImage;
      
      // Проверка обязательных полей
      if (!requestId) {
        return NextResponse.json(
          { error: 'ID заявки обязателен' },
          { status: 400 }
        );
      }
    } else {
      // Для операторов и админов получаем все данные из тела запроса
      const operatorBody = await request.json();
      requestId = operatorBody.requestId;
      status = operatorBody.status;
      paymentDetails = operatorBody.paymentDetails;
      receiptImage = operatorBody.receiptImage;
      transactionHash = operatorBody.transactionHash;
      
      // Проверка обязательных полей
      if (!requestId || !status) {
        return NextResponse.json(
          { error: 'ID заявки и статус обязательны' },
          { status: 400 }
        );
      }
    }

    // Проверка обязательных полей
    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'ID заявки и статус обязательны' },
        { status: 400 }
      );
    }

    // Получение заявки по requestId
    const requestDetails: any = await getBuyRequestByRequestId(requestId);
    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    // Проверка роли пользователя для определенных статусов
    if (user.role !== 'admin' && user.role !== 'operator') {
      // Для статуса 'paid' проверяем, что пользователь является владельцем заявки
      if (status === 'paid' && requestDetails.user_id !== session.user_id) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
      
      // Для статуса 'completed' проверяем, что пользователь является владельцем заявки
      if (status === 'completed' && requestDetails.user_id !== session.user_id) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
    } else {
      // Для операторов и админов проверяем другие условия
      // Проверка допустимых значений статуса
      const validStatuses = ['pending', 'processing', 'paid', 'completed', 'cancelled', 'disputed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Недопустимый статус' },
        { status: 400 }
        );
      }

      // Проверка, что заявка не находится в обработке другим оператором
      if (status === 'processing' && 
          requestDetails.status === 'processing' && 
          requestDetails.operator_id && 
          requestDetails.operator_id !== session.user_id) {
        return NextResponse.json(
          { error: 'Заявка уже находится в обработке другим оператором' },
          { status: 400 }
        );
      }

      // Проверка прав на отмену заявки
      if (status === 'cancelled' && user.role === 'operator') {
        // Оператор может отменить заявку только если он ее обрабатывает
        if (requestDetails.operator_id && requestDetails.operator_id !== session.user_id) {
          return NextResponse.json(
            { error: 'Вы можете отменить только ту заявку, которую обрабатываете' },
            { status: 403 }
          );
        }
      }
    }

    // Подготовка полей для обновления
    const updateData: any = {
      status: status
    };

    // Добавляем дополнительные поля при определенных статусах
    if (status === 'processing' && (user.role === 'admin' || user.role === 'operator')) {
      updateData.operator_id = session.user_id;
      updateData.payment_details = paymentDetails || '';
    } else if (status === 'paid') {
      updateData.receipt_image = receiptImage || '';
    } else if (status === 'completed' && transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    // Обновление статуса заявки
    const updatedRequest = await updateBuyRequest(requestDetails.id, updateData);

    return NextResponse.json(
      {
        success: true,
        message: 'Статус заявки успешно обновлен',
        request: convertTimestamps(updatedRequest)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Buy request update error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при обновлении статуса заявки' },
      { status: 500 }
    );
  }
}

// Удаление заявки (только для администраторов или если заявка в статусе pending)
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

    // Получение данных из тела запроса
    const { requestId } = await request.json();

    // Проверка обязательных полей
    if (!requestId) {
      return NextResponse.json(
        { error: 'ID заявки обязателен' },
        { status: 400 }
      );
    }

    // Получение заявки по requestId
    const requestDetails: any = await getBuyRequestByRequestId(requestId);
    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
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

    // Проверка прав на удаление
    if (user.role !== 'admin' && 
        (requestDetails.user_id !== session.user_id || 
         (requestDetails.status !== 'pending' && requestDetails.status !== 'cancelled'))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Удаление заявки (в Firestore мы не удаляем документы, а помечаем их как удаленные)
    const updatedRequest = await updateBuyRequest(requestDetails.id, {
      deleted: true,
      deleted_at: new Date()
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Заявка успешно удалена'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Buy request deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при удалении заявки' },
      { status: 500 }
    );
  }
}