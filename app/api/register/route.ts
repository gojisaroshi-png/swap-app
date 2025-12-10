import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getUserByUsername, getUserByEmail, createUser } from '@/lib/firestore-db';

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

    // Проверка существования пользователя с таким же именем или email в Firestore
    const existingUserByUsername = await getUserByUsername(username);
    const existingUserByEmail = await getUserByEmail(email);

    if (existingUserByUsername || existingUserByEmail) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем или email уже существует' },
        { status: 409 }
      );
    }

    // Хэширование пароля
    const hashedPassword = await hashPassword(password);

    // Создание нового пользователя в Firestore
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        userId: newUser.id
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