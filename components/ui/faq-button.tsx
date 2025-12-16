"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { FAQModal } from '@/components/ui/faq-modal';
import { useTranslation } from '@/hooks/useTranslation';

export function FAQButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 z-40"
        onClick={() => setIsModalOpen(true)}
      >
        <HelpCircle className="h-6 w-6" />
        <span className="sr-only">{t('faq.button')}</span>
      </Button>
      
      <FAQModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}