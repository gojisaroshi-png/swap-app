// Утилиты для работы с аутентификацией (серверные функции)
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db';
import { cookies } from 'next/headers';

// Типы для TypeScript
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface DecodedToken {
  userId: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
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
    
    // Получение пользователя из БД
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId], (err, row: User) => {
        if (err) {
          reject(null);
        } else {
          resolve(row || null);
        }
      });
    });
  } catch {
    return null;
  }
}

// Создание сессии в БД
export async function createSession(userId: number, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Токен действует 1 день
    
    db.run(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt.toISOString()],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

// Проверка сессии
export async function validateSession(token: string): Promise<Session | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT s.*, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?',
      [token, new Date().toISOString()],
      (err, row: Session) => {
        if (err) {
          reject(null);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

// Удаление сессии
export async function removeSession(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}