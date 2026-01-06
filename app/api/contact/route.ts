import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '@/lib/telegram-config';

// Создаем экземпляр бота
const bot = new TelegramBot(TELEGRAM_CONFIG.BOT_TOKEN, { polling: false });

// Функция для отправки уведомления в Telegram канал
async function sendTelegramNotification(message: string): Promise<boolean> {
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

export async function POST(request: Request) {
  try {
    // Получение данных из тела запроса
    const { name, email, message } = await request.json();

    // Проверка обязательных полей
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Формируем сообщение для Telegram
    const telegramMessage = `
🔔 Новое сообщение через форму обратной связи

Имя: ${name}
Email: ${email}
Сообщение:
${message}
    `.trim();

    // Отправляем уведомление в Telegram
    const success = await sendTelegramNotification(telegramMessage);

    if (success) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время." 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: "Ошибка при отправке сообщения. Пожалуйста, попробуйте позже." 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже." 
      },
      { status: 500 }
    );
  }
}