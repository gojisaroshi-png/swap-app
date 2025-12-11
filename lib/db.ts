// Функция для генерации уникального ID заявки
export function generateRequestId() {
  return 'BR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}