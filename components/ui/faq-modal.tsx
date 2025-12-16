"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  created_at: Date;
  updated_at: Date;
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      fetchFAQItems();
    }
  }, [isOpen]);

  const fetchFAQItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faq');
      const data = await response.json();
      setFaqItems(data.faq || []);
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] mx-4">
        <Card className="bg-background border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center">
              <HelpCircle className="mr-2 h-6 w-6" />
              {t('faq.title')}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">
                <p>{t('faq.loading')}</p>
              </div>
            ) : faqItems.length === 0 ? (
              <div className="p-6 text-center">
                <p>{t('faq.noItems')}</p>
              </div>
            ) : (
              <div className="h-[60vh] overflow-y-auto p-6">
                <div className="space-y-4">
                  {faqItems.map((item) => (
                    <div key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}