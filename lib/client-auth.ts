// Клиентские функции для работы с аутентификацией
// Этот файл может использоваться в клиентских компонентах

// Функция для получения токена из cookies (на стороне клиента)
export function getClientToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return value;
    }
  }
  return null;
}

// Функция для проверки, авторизован ли пользователь (на стороне клиента)
export function isAuthenticated(): boolean {
  return !!getClientToken();
}

// Функция для получения данных текущего пользователя
export async function getCurrentUser() {
  const token = getClientToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        // Пользователь забанен
        throw new Error('User is banned');
      }
      throw new Error('Failed to fetch user data');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}