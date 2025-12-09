"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface LoliCharacterProps {
  type: "user" | "admin" | "operator";
  className?: string;
}

export function LoliCharacter({ type, className = "" }: LoliCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Определение свойств персонажа в зависимости от типа
  const characterProps = {
    user: {
      name: "Аня",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/20",
      borderColor: "border-pink-500/30",
      hair: "bg-pink-300",
      eyes: "bg-blue-400",
      clothes: "bg-pink-400",
      accessory: "bg-yellow-400",
    },
    admin: {
      name: "Лена",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      hair: "bg-purple-300",
      eyes: "bg-purple-400",
      clothes: "bg-purple-400",
      accessory: "bg-purple-200",
    },
    operator: {
      name: "Маша",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      hair: "bg-amber-200",
      eyes: "bg-green-400",
      clothes: "bg-blue-400",
      accessory: "bg-blue-200",
    },
  };

  const props = characterProps[type];

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Фон персонажа */}
      <div className={`absolute inset-0 rounded-full ${props.bgColor} ${props.borderColor} border-2 blur-md opacity-50`}></div>
      
      {/* Основа персонажа */}
      <div className="relative w-16 h-16 rounded-full bg-white border-2 border-white overflow-hidden">
        {/* Волосы */}
        <div className={`absolute top-0 left-0 right-0 h-6 rounded-t-full ${props.hair}`}></div>
        
        {/* Лицо */}
        <div className="absolute top-6 left-2 right-2 bottom-3 bg-[#FFDBC2] rounded-b-full">
          {/* Глаза */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white">
            <div className={`absolute inset-0.5 rounded-full ${props.eyes}`}></div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white">
            <div className={`absolute inset-0.5 rounded-full ${props.eyes}`}></div>
          </div>
          
          {/* Рот */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-pink-300 rounded-full"></div>
        </div>
        
        {/* Одежда */}
        <div className={`absolute bottom-0 left-0 right-0 h-3 ${props.clothes}`}></div>
        
        {/* Аксессуар (зависит от типа персонажа) */}
        {type === "user" && (
          // Бант
          <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 ${props.accessory} rounded-full`}></div>
        )}
        {type === "admin" && (
          // Очки
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rounded-full"></div>
        )}
        {type === "operator" && (
          // Шляпа
          <div className={`absolute -top-1 left-0 right-0 h-2 ${props.accessory} rounded-t-full`}></div>
        )}
      </div>
      
      {/* Анимация при наведении */}
      {isHovered && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {props.name}
        </motion.div>
      )}
    </motion.div>
  );
}