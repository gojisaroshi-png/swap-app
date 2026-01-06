"use client";

import { useState } from "react";
import { ContactForm } from "@/components/ui/contact-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Связаться с нами</h2>
            <p className="text-muted-foreground">
              Заполните форму и мы свяжемся с вами в ближайшее время
            </p>
          </div>
          
          <ContactForm onClose={() => router.push('/')} />
        </motion.div>
      </main>
    </div>
  );
}