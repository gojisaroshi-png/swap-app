import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const borderSize = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4'
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${borderSize[size]} 
          border-t-orange-500 border-r-orange-500 border-b-orange-500 border-l-transparent
          rounded-full 
          animate-spin
          ${className}
        `}
        role="status"
        aria-label="Загрузка"
      >
        <span className="sr-only">Загрузка...</span>
      </div>
    </div>
  );
};