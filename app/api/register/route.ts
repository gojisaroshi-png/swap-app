import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // Проверка обязательных полей
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверка длины пароля
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя с таким же именем или email
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем или email уже существует' },
        { status: 409 }
      );
    }

    // Хэширование пароля
    const hashedPassword = await hashPassword(password);

    // Создание нового пользователя
    const result: any = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Пользователь успешно зарегистрирован',
        userId: result.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при регистрации' },
      { status: 500 }
    );
  }
}