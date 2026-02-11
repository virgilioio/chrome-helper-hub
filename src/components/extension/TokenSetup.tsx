import React from 'react';
import { GioFlipLoader } from './GioFlipLoader';
import { getSafeExtensionUrl } from '@/lib/chromeApi';

// Small inline loader for buttons
const ButtonLoader = () => (
  <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FA5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const LogInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

interface TokenSetupProps {
  onConnect: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  oauthInProgress?: boolean;
  onCancelOAuth?: () => void;
}

// Get the avatar URL - works in both popup and content script contexts
const getAvatarUrl = (): string => {
  return getSafeExtensionUrl('gio-face-2.png');
};

export const TokenSetup: React.FC<TokenSetupProps> = ({ 
  onConnect, 
  isLoading, 
  error,
  oauthInProgress = false,
  onCancelOAuth 
}) => {
  const handleConnect = async () => {
    await onConnect();
  };

  const avatarUrl = getAvatarUrl();

  // OAuth In Progress View - shown when popup window is open
  if (oauthInProgress) {
    return (
      <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: '100%' }}>
        <div style={{ width: '100%', maxWidth: '288px', margin: '0 auto', textAlign: 'center' }}>
          {/* Animated Gio Flip Loader */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <GioFlipLoader size={64} />
          </div>

          {/* Title */}
          <h2 className="gogio-title">
            Authenticating<span className="gogio-title-period">...</span>
          </h2>

          {/* Helper Text */}
          <p className="gogio-description">
            Complete the sign-in in the popup window that just opened.
          </p>

          {/* Cancel Button */}
          {onCancelOAuth && (
            <button 
              onClick={onCancelOAuth}
              className="gogio-btn-secondary"
              style={{ marginTop: 8 }}
            >
              <XIcon />
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error/Retry View
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: '100%' }}>
        <div style={{ width: '100%', maxWidth: '288px', margin: '0 auto', textAlign: 'center' }}>
          {/* Error Icon Container */}
          <div className="gogio-error-icon-container">
            <AlertTriangleIcon />
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
                <ButtonLoader />
                Connecting...
              </>
            ) : (
              <>
                <RefreshIcon />
                Try Again
              </>
            )}
          </button>

          {/* Log Out Button */}
          <button className="gogio-btn-secondary" style={{ marginTop: 8 }}>
            <LogOutIcon />
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
          {avatarUrl ? (
            <img src={avatarUrl} alt="GoGio" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#6F3FF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>G</div>
          )}
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
              <ButtonLoader />
              Connecting...
            </>
          ) : (
            <>
              <LogInIcon />
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