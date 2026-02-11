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

  const logoUrl = getSafeExtensionUrl('gogio-logo.png') || '/gogio-logo.png';

  return (
    <img 
      src={logoUrl} 
      alt="GoGio" 
      style={{ ...sizeStyles[size], objectFit: 'contain' }}
      className={className}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
};
