import React from 'react';
import { Loader2, AlertTriangle, LogIn, RefreshCw, LogOut } from 'lucide-react';

interface TokenSetupProps {
  onConnect: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Get the avatar URL - works in both popup and content script contexts
const getAvatarUrl = (): string => {
  const chrome = (globalThis as any).chrome;
  if (chrome?.runtime?.getURL) {
    return chrome.runtime.getURL('gio-avatar-blue.png');
  }
  return '/gio-avatar-blue.png';
};

export const TokenSetup: React.FC<TokenSetupProps> = ({ onConnect, isLoading, error }) => {
  const handleConnect = async () => {
    await onConnect();
  };

  const avatarUrl = getAvatarUrl();

  // Error/Retry View
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: '100%' }}>
        <div style={{ width: '100%', maxWidth: '288px', margin: '0 auto', textAlign: 'center' }}>
          {/* Error Icon Container */}
          <div className="gogio-error-icon-container">
            <AlertTriangle style={{ width: 32, height: 32, color: '#FA5252' }} />
          </div>

          {/* Title with purple period */}
          <h2 className="gogio-title">
            Connection Failed<span className="gogio-title-period">.</span>
          </h2>

          {/* Error Description */}
          <p className="gogio-description" style={{ marginTop: 8 }}>
            {error}
          </p>

          {/* Try Again Button */}
          <button
            onClick={handleConnect}
            className="gogio-btn-connect"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCw style={{ width: 16, height: 16 }} />
                Try Again
              </>
            )}
          </button>

          {/* Log Out Button */}
          <button className="gogio-btn-secondary" style={{ marginTop: 8 }}>
            <LogOut style={{ width: 14, height: 14 }} />
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Connect View
  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: '100%' }}>
      <div style={{ width: '100%', maxWidth: '288px', margin: '0 auto', textAlign: 'center' }}>
        {/* Logo Container - 64x64 circle with 10% purple bg */}
        <div className="gogio-logo-container">
          <img src={avatarUrl} alt="GoGio" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        </div>

        {/* Title with purple period */}
        <h2 className="gogio-title">
          Connect to GoGio<span className="gogio-title-period">.</span>
        </h2>

        {/* Description */}
        <p className="gogio-description">
          Sign in to your GoGio account to start adding candidates directly from LinkedIn.
        </p>

        {/* Connect Button - Lilac Frost */}
        <button
          onClick={handleConnect}
          className="gogio-btn-connect"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              Connecting...
            </>
          ) : (
            <>
              <LogIn style={{ width: 16, height: 16 }} />
              Connect with GoGio
            </>
          )}
        </button>

        {/* Link Text */}
        <p className="gogio-link-text">
          Need an account? <a href="https://gogio.io" target="_blank" rel="noopener noreferrer">Sign up at gogio.io</a>
        </p>
      </div>
    </div>
  );
};
