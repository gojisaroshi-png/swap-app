"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { ContactModal } from '@/components/ui/contact-modal';

export function ContactButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-20 right-6 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 z-40"
        onClick={() => setIsModalOpen(true)}
      >
        <Mail className="h-6 w-6" />
        <span className="sr-only">Связаться с нами</span>
      </Button>
      
      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}