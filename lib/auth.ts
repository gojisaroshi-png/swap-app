// Утилиты для работы с аутентификацией (серверные функции)
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getUserById, getSessionByToken, deleteSession } from '@/lib/firestore-db';

// Типы для TypeScript
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface DecodedToken {
  userId: string;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'blockchain_lavka_secret';
const TOKEN_EXPIRATION = '1d';

// Хэширование пароля
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Проверка пароля
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Генерация JWT токена
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRATION }
  );
}

// Проверка токена
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

// Получение текущего пользователя (только для серверных компонентов)
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded: any = verifyToken(token);
    if (!decoded) return null;
    
    // Получение пользователя из Firestore
    const userData: any = await getUserById(decoded.userId);
    if (!userData) return null;
    
    // Преобразуем данные пользователя в нужный формат
    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role
    };
    
    return user;
  } catch {
    return null;
  }
}

// Создание сессии в Firestore
export async function createSession(sessionData: any): Promise<void> {
  try {
    // Сессия уже создается в login API route
    // Эта функция может быть удалена или использована для дополнительной логики
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

// Проверка сессии через Firestore
export async function validateSession(token: string): Promise<any | null> {
  try {
    // Получаем сессию из Firestore
    const session: any = await getSessionByToken(token);
    
    if (!session) {
      return null;
    }
    
    // Проверяем, не истекла ли сессия
    const now = new Date();
    if (session.expires_at.toDate() < now) {
      // Сессия истекла, удаляем её
      await deleteSession(token);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Удаление сессии из Firestore
export async function removeSession(token: string): Promise<void> {
  try {
    await deleteSession(token);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}