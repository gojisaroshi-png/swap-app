import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSessionByToken } from '@/lib/firestore-db';

// Список защищенных маршрутов и их роли
const protectedRoutes = [
  { path: '/profile', roles: ['user', 'operator', 'admin'] },
  { path: '/admin', roles: ['admin'] },
  { path: '/operator', roles: ['operator', 'admin'] }
];

// Список публичных маршрутов
const publicRoutes = ['/', '/auth', '/buy', '/exchange', '/track'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверка, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Получение токена из cookies
  const token = request.cookies.get('token')?.value;

  // Если маршрут публичный, пропустить проверку
  if (isPublicRoute && pathname !== '/profile' && pathname !== '/admin' && pathname !== '/operator') {
    return NextResponse.next();
  }

  // Если токен отсутствует и маршрут защищенный, перенаправить на страницу входа
  if (!token) {
    if (!isPublicRoute || pathname === '/profile' || pathname === '/admin' || pathname === '/operator') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    return NextResponse.next();
  }

  try {
    // Проверка токена
    const decoded = verifyToken(token);
    
    if (!decoded) {
      // Если токен недействителен, перенаправить на страницу входа
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Проверка сессии в Firestore
    const session: any = await getSessionByToken(token);
    
    if (!session) {
      // Если сессия не найдена, перенаправить на страницу входа
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Проверяем, не истекла ли сессия
    const now = new Date();
    // Проверяем, не истекла ли сессия
    const expiresAt = session.expires_at instanceof Date ? session.expires_at : new Date(session.expires_at);
    if (expiresAt < now) {
      // Сессия истекла, удаляем её
      // Удаляем сессию из Firestore
      const { deleteSession } = await import('@/lib/firestore-db');
      await deleteSession(token);
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Проверка ролей для защищенных маршрутов
    const route = protectedRoutes.find(r => pathname.startsWith(r.path));
    
    if (route) {
      const userRole = decoded.role;
      
      // Проверка, имеет ли пользователь доступ к маршруту
      if (!route.roles.includes(userRole)) {
        // Если пользователь не имеет доступа, показать страницу 403
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

// Настройка matcher для middleware
export const config = {
  matcher: [
    '/profile',
    '/admin',
    '/operator',
    '/profile/:path*',
    '/admin/:path*',
    '/operator/:path*'
  ]
};