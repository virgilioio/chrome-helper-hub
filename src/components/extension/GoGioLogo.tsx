import React from 'react';

interface GoGioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GoGioLogo: React.FC<GoGioLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`font-heading font-bold ${sizeClasses[size]} ${className}`}>
      <span className="text-primary">Go</span>
      <span className="text-foreground">Gio</span>
    </div>
  );
};
