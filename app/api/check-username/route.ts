import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/firestore-db';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    // Проверка обязательного поля
    if (!username) {
      return NextResponse.json(
        { error: 'Имя пользователя обязательно' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя с таким именем в Firestore
    const existingUser: any = await getUserByUsername(username);

    return NextResponse.json(
      {
        exists: !!existingUser,
        message: existingUser
          ? 'Имя пользователя уже занято'
          : 'Имя пользователя доступно'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при проверке имени пользователя' },
      { status: 500 }
    );
  }
}