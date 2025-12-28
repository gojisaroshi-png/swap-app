const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_CONFIG } = require('./telegram-config');

// Создаем экземпляр бота
const bot = new TelegramBot(TELEGRAM_CONFIG.BOT_TOKEN, { polling: false });

// Функция для отправки уведомления в Telegram канал
async function sendTelegramNotification(message) {
  try {
    // Отправляем сообщение в канал
    await bot.sendMessage(TELEGRAM_CONFIG.CHANNEL_ID, message);
    console.log('Уведомление успешно отправлено в Telegram канал');
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления в Telegram:', error);
    // Выводим дополнительную информацию для отладки
    console.error('Конфигурация:', {
      token: TELEGRAM_CONFIG.BOT_TOKEN ? 'Скрыт для безопасности' : 'Не задан',
      channelId: TELEGRAM_CONFIG.CHANNEL_ID
    });
    return false;
  }
}

// Функция для форматирования уведомления о заявке на покупку
function formatBuyRequestNotification(request, user) {
  return `
🔔 Новая заявка на покупку криптовалюты

ID заявки: ${request.id || request.request_id}
Пользователь: ${user.username || user.email || user.user_id}
Тип криптовалюты: ${request.crypto_type}
Сумма: ${request.amount} ${request.currency || 'USD'}
Количество криптовалюты: ${request.crypto_amount ? request.crypto_amount.toFixed(6) : 'Не указано'}
Метод оплаты: ${request.payment_method || 'Не указан'}
Статус: ${request.status || 'pending'}
Время создания: ${request.created_at ? new Date(request.created_at).toLocaleString('ru-RU') : 'Не указано'}
  `.trim();
}

// Функция для форматирования уведомления о заявке на вывод
function formatWithdrawalRequestNotification(request, user) {
  return `
🔔 Новая заявка на вывод криптовалюты

ID заявки: ${request.id}
Пользователь: ${user.username || user.email || user.user_id}
Тип криптовалюты: ${request.crypto_type}
Сумма: ${request.amount}
Адрес кошелька: ${request.wallet_address || 'Не указан'}
Сеть: ${request.network || 'Не указана'}
Статус: ${request.status || 'pending'}
Время создания: ${request.created_at ? new Date(request.created_at).toLocaleString('ru-RU') : 'Не указано'}
  `.trim();
}

module.exports = {
  sendTelegramNotification,
  formatBuyRequestNotification,
  formatWithdrawalRequestNotification
};