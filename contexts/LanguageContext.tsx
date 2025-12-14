"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { getBrowserLanguage } from '@/lib/i18n';

// Тип для контекста языка
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

// Создаем контекст
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Провайдер контекста
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>('en');

  // Инициализация языка при загрузке
  useEffect(() => {
    // Проверяем, есть ли сохраненный язык в localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else {
      // Если нет сохраненного языка, используем язык браузера
      const browserLang = getBrowserLanguage();
      setLanguage(browserLang);
    }
  }, []);

  // Сохраняем язык в localStorage при его изменении
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Хук для использования контекста языка
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}