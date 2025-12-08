import React from 'react';
import logoImage from '@/assets/gogio-logo.png';

interface GoGioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'icon' | 'wordmark';
}

export const GoGioLogo: React.FC<GoGioLogoProps> = ({ size = 'md', className = '', variant = 'wordmark' }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  return (
    <img 
      src={logoImage} 
      alt="GoGio" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );
};
