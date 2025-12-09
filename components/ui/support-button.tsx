'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function SupportButton() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Link
        href="https://t.me/PrivaXSupport"
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center shadow-lg cursor-pointer relative"
        >
          <MessageCircle className="w-6 h-6 text-white" />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute right-16 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          >
            <span className="text-sm font-medium text-foreground">Support</span>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
