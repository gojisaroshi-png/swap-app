"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ContactFormProps {
  onClose?: () => void;
}

export function ContactForm({ onClose }: ContactFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Отправляем данные формы на сервер
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          success: true,
          message: result.message || "Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время."
        });
        // Очищаем форму
        setName("");
        setEmail("");
        setMessage("");
        
        // Закрываем форму через 3 секунды
        setTimeout(() => {
          if (onClose) onClose();
        }, 3000);
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || "Ошибка при отправке сообщения. Пожалуйста, попробуйте позже."
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        success: false,
        message: "Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-card-foreground bg-background/90 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl">
      <div className="flex flex-col space-y-1.5 p-6 text-center pb-4">
        <h3 className="tracking-tight text-2xl font-bold text-white">
          Связаться с нами
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Заполните форму и мы свяжемся с вами в ближайшее время
        </p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Имя</Label>
            <Input
              id="name"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background/50 border-white/10 focus:border-purple-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-white/10 focus:border-purple-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-foreground">Сообщение</Label>
            <textarea
              id="message"
              placeholder="Введите ваше сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="flex w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-purple-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 caret-purple-500 resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 hover:bg-white/10"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-center text-sm text-muted-foreground">
            Или свяжитесь с нами напрямую в Telegram:
          </p>
          <Button
            variant="outline"
            className="w-full mt-3 border-white/10 hover:bg-white/10"
            onClick={() => window.open(`https://t.me/blockchain_lavka_bot`, "_blank")}
          >
            Написать в Telegram
          </Button>
        </div>
      </div>
    </div>
  );
}