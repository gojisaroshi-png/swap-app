import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';

// Хук для использования переводов
export function useTranslation() {
  const { language } = useLanguage();
  
  // Функция для получения перевода по ключу
  const t = (key: string): string => {
    return getTranslation(key, language);
  };
  
  return { t, language };
}