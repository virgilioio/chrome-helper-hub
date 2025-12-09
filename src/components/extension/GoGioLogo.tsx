import React from 'react';

interface GoGioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'icon' | 'wordmark';
}

// Get the logo URL - works in both popup and content script contexts
const getLogoUrl = (): string => {
  const chrome = (globalThis as any).chrome;
  if (chrome?.runtime?.getURL) {
    return chrome.runtime.getURL('gogio-logo.png');
  }
  // Fallback for development
  return '/gogio-logo.png';
};

export const GoGioLogo: React.FC<GoGioLogoProps> = ({ size = 'md', className = '', variant = 'wordmark' }) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '24px', width: 'auto' },
    md: { height: '32px', width: 'auto' },
    lg: { height: '40px', width: 'auto' },
  };

  return (
    <img 
      src={getLogoUrl()} 
      alt="GoGio" 
      style={{ ...sizeStyles[size], objectFit: 'contain' }}
      className={className}
    />
  );
};
