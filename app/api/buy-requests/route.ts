import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import db from '@/lib/db';
import { generateRequestId } from '@/lib/db';

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
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
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

    let requestsQuery = '';
    let queryParams: any[] = [];

    // Формирование запроса в зависимости от роли пользователя
    if (user.role === 'admin') {
      // Для администраторов - все заявки
      requestsQuery = 'SELECT br.*, u.username as user_username, o.username as operator_username FROM buy_requests br JOIN users u ON br.user_id = u.id LEFT JOIN users o ON br.operator_id = o.id ORDER BY br.created_at DESC';
    } else if (user.role === 'operator') {
      // Для операторов - только ожидающие заявки
      requestsQuery = 'SELECT br.*, u.username as user_username FROM buy_requests br JOIN users u ON br.user_id = u.id WHERE br.status = ? ORDER BY br.created_at DESC';
      queryParams = ['pending'];
    } else {
      // Для обычных пользователей - только их заявки
      requestsQuery = 'SELECT * FROM buy_requests WHERE user_id = ? ORDER BY created_at DESC';
      queryParams = [session.user_id];
    }

    // Получение заявок
    const requests: any[] = await new Promise((resolve, reject) => {
      db.all(
        requestsQuery,
        queryParams,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });

    return NextResponse.json(
      { 
        requests,
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
    const activeRequest: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM buy_requests WHERE user_id = ? AND status IN (?, ?)',
        [session.user_id, 'pending', 'processing'],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (activeRequest) {
      return NextResponse.json(
        { error: 'У вас уже есть активная заявка. Дождитесь её завершения.' },
        { status: 400 }
      );
    }

    // Генерация уникального ID заявки
    const requestId = generateRequestId();

    // Создание новой заявки
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO buy_requests (user_id, request_id, crypto_type, amount, currency, payment_method, wallet_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [session.user_id, requestId, cryptoType, amount, currency, paymentMethod, walletAddress],
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
        message: 'Заявка на покупку успешно создана',
        requestId
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
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role FROM users WHERE id = ?',
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

    // Проверка роли пользователя для определенных статусов
    if (user.role !== 'admin' && user.role !== 'operator') {
      // Для статуса 'paid' проверяем, что пользователь является владельцем заявки
      if (status === 'paid') {
        const requestDetails: any = await new Promise((resolve, reject) => {
          db.get(
            'SELECT user_id FROM buy_requests WHERE request_id = ?',
            [requestId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });
        
        if (!requestDetails || requestDetails.user_id !== session.user_id) {
          return NextResponse.json(
            { error: 'Доступ запрещен' },
            { status: 403 }
          );
        }
      }
      
      // Для статуса 'completed' проверяем, что пользователь является владельцем заявки
      if (status === 'completed') {
        const requestDetails: any = await new Promise((resolve, reject) => {
          db.get(
            'SELECT user_id FROM buy_requests WHERE request_id = ?',
            [requestId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });
        
        if (!requestDetails || requestDetails.user_id !== session.user_id) {
          return NextResponse.json(
            { error: 'Доступ запрещен' },
            { status: 403 }
          );
        }
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
      if (status === 'processing') {
        const requestDetails: any = await new Promise((resolve, reject) => {
          db.get(
            'SELECT status, operator_id FROM buy_requests WHERE request_id = ?',
            [requestId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (requestDetails && requestDetails.status === 'processing' && requestDetails.operator_id !== session.user_id) {
          return NextResponse.json(
            { error: 'Заявка уже находится в обработке другим оператором' },
            { status: 400 }
          );
        }
      }

      // Проверка прав на отмену заявки
      if (status === 'cancelled' && user.role === 'operator') {
        // Оператор может отменить заявку только если он ее обрабатывает
        const requestDetails: any = await new Promise((resolve, reject) => {
          db.get(
            'SELECT operator_id FROM buy_requests WHERE request_id = ?',
            [requestId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (requestDetails && requestDetails.operator_id !== session.user_id) {
          return NextResponse.json(
            { error: 'Вы можете отменить только ту заявку, которую обрабатываете' },
            { status: 403 }
          );
        }
      }
    }

    // Подготовка полей для обновления
    let updateFields = 'status = ?';
    let updateParams: any[] = [status];

    // Добавляем дополнительные поля при определенных статусах
    if (status === 'processing' && user.role !== 'admin' && user.role !== 'operator') {
      // Обычные пользователи не могут установить статус 'processing'
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    } else if (status === 'processing') {
      updateFields += ', operator_id = ?, payment_details = ?';
      updateParams.push(session.user_id);
      updateParams.push(paymentDetails || '');
    } else if (status === 'paid') {
      updateFields += ', receipt_image = ?';
      updateParams.push(receiptImage || '');
    } else if (status === 'completed' && transactionHash) {
      updateFields += ', transaction_hash = ?';
      updateParams.push(transactionHash);
    }

    updateParams.push(requestId);

    // Обновление статуса заявки
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE buy_requests SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE request_id = ?`,
        updateParams,
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
        message: 'Статус заявки успешно обновлен'
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

    // Проверка, что заявка принадлежит пользователю или пользователь является администратором
    const requestDetails: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id, status FROM buy_requests WHERE request_id = ?',
        [requestId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    // Получение роли пользователя
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM users WHERE id = ?',
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

    // Проверка прав на удаление
    if (user.role !== 'admin' && (requestDetails.user_id !== session.user_id || (requestDetails.status !== 'pending' && requestDetails.status !== 'cancelled'))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Удаление заявки
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM buy_requests WHERE request_id = ?',
        [requestId],
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