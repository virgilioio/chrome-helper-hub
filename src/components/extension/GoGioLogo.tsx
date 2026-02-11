import React from 'react';
import { getSafeExtensionUrl } from '@/lib/chromeApi';

interface GoGioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'icon' | 'wordmark';
}

export const GoGioLogo: React.FC<GoGioLogoProps> = ({ size = 'md', className = '', variant = 'wordmark' }) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '24px', width: 'auto' },
    md: { height: '32px', width: 'auto' },
    lg: { height: '40px', width: 'auto' },
  };

  const logoUrl = getSafeExtensionUrl('gogio-logo.png');

  if (!logoUrl) {
    return (
      <span
        className={className}
        style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : '24px', color: '#6F3FF5', letterSpacing: '-0.5px' }}
      >
        GoGio
      </span>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt="GoGio" 
      style={{ ...sizeStyles[size], objectFit: 'contain' }}
      className={className}
    />
  );
};
