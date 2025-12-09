'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

export function BottomBar() {
  const [copied, setCopied] = useState(false);
  const contractAddress = "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <button
            onClick={copyToClipboard}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-violet-500/50 text-sm"
          >
            <span className="text-xs font-medium text-muted-foreground group-hover:text-violet-400 transition-colors">
              CA: <span className="font-mono">{contractAddress}</span>
            </span>
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-green-400"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-muted-foreground group-hover:text-violet-400"
                >
                  <Copy className="w-3 h-3" />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-xs text-green-400 font-medium absolute -top-7 left-1/2 -translate-x-1/2 bg-background/90 px-2 py-1 rounded-full border border-green-500/20"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.footer>
  );
}
