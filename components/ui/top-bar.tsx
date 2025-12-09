"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("swap");
  const swapRef = useRef<HTMLButtonElement>(null);
  const buyRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname === "/") {
      setActiveTab("swap");
    } else if (pathname === "/buy") {
      setActiveTab("buy");
    } else if (pathname === "/profile") {
      setActiveTab("profile");
    }
  }, [pathname]);

  // Эффект для обновления позиции индикатора при изменении активной вкладки
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const activeRef = activeTab === "swap" ? swapRef : activeTab === "buy" ? buyRef : profileRef;
      if (activeRef.current) {
        // Получаем размеры и позицию активной кнопки
        const { offsetWidth, offsetLeft } = activeRef.current;
        
        // Обновляем стили индикатора
        const indicator = document.querySelector('[data-indicator]');
        if (indicator) {
          (indicator as HTMLElement).style.width = `${offsetWidth - 8}px`;
          (indicator as HTMLElement).style.left = `${offsetLeft + 4}px`;
        }
      }
    };
    
    updateIndicatorPosition();
    window.addEventListener('resize', updateIndicatorPosition);
    
    return () => {
      window.removeEventListener('resize', updateIndicatorPosition);
    };
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "swap") {
      router.push("/");
    } else if (tab === "buy") {
      router.push("/buy");
    } else if (tab === "profile") {
      router.push("/profile");
    }
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          <div className="relative flex space-x-1 p-1 bg-secondary/50 rounded-xl">
            {/* Active tab indicator */}
            <motion.div
              layoutId="activeTab"
              className="absolute top-1 bottom-1 bg-primary rounded-xl shadow-lg"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              data-indicator
            />
            
            <button
              ref={swapRef}
              onClick={() => handleTabChange("swap")}
              className={`px-4 py-2 rounded-xl transition-all relative z-10 text-sm md:text-base md:px-6 md:py-2 ${
                activeTab === "swap"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Exchange
            </button>
            <button
              ref={buyRef}
              onClick={() => handleTabChange("buy")}
              className={`px-4 py-2 rounded-xl transition-all relative z-10 text-sm md:text-base md:px-6 md:py-2 ${
                activeTab === "buy"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Buy Crypto
            </button>
            <button
              ref={profileRef}
              onClick={() => handleTabChange("profile")}
              className={`px-4 py-2 rounded-xl transition-all relative z-10 text-sm md:text-base md:px-6 md:py-2 ${
                activeTab === "profile"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
