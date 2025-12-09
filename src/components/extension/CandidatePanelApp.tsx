import React, { useState } from 'react';
import { useExtensionAuth } from '@/hooks/useExtensionAuth';
import { TokenSetup } from './TokenSetup';
import { CandidateForm } from './CandidateForm';
import { SettingsPanel } from './SettingsPanel';
import { GoGioLogo } from './GoGioLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Inline SVG icons for content script compatibility
const LoaderIcon = () => (
  <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg className="h-12 w-12 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

type View = 'form' | 'settings';

interface CandidatePanelAppProps {
  /** Optional class for container styling */
  className?: string;
}

/**
 * Core candidate panel logic shared between popup and sidebar.
 * Handles auth state, view switching, and renders appropriate components.
 */
export const CandidatePanelApp: React.FC<CandidatePanelAppProps> = ({ className = '' }) => {
  const { 
    status, 
    user, 
    error, 
    token, 
    oauthInProgress,
    setToken, 
    clearToken, 
    refreshAuth, 
    loginWithOAuth,
    cancelOAuth 
  } = useExtensionAuth();
  const [currentView, setCurrentView] = useState<View>('form');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleOAuthConnect = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const result = await loginWithOAuth();
      return result;
    } finally {
      setIsConnecting(false);
    }
  };

  // OAuth in progress - show dedicated waiting UI
  if (oauthInProgress) {
    return (
      <div className={`bg-background ${className}`}>
        <TokenSetup
          onConnect={handleOAuthConnect}
          isLoading={true}
          error={null}
          oauthInProgress={true}
          onCancelOAuth={cancelOAuth}
        />
      </div>
    );
  }

  // Loading state (initial load, not OAuth)
  if (status === 'loading' && !isConnecting) {
    return (
      <div className={`flex flex-col items-center justify-center bg-background p-8 ${className}`}>
        <GoGioLogo size="lg" className="mb-4" />
        <LoaderIcon />
        <p className="mt-4 text-sm text-muted-foreground">Connecting to GoGio...</p>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className={`bg-background ${className}`}>
        <TokenSetup
          onConnect={handleOAuthConnect}
          isLoading={isConnecting}
          error={null}
        />
      </div>
    );
  }

  // Error state (invalid/expired token or OAuth error)
  if (status === 'error') {
    return (
      <div className={`bg-background ${className}`}>
        <TokenSetup
          onConnect={handleOAuthConnect}
          isLoading={isConnecting}
          error={error}
        />
      </div>
    );
  }

  // Authenticated states
  if (status === 'authenticated' && user) {
    if (currentView === 'settings') {
      return (
        <SettingsPanel
          token={token}
          userEmail={user.email}
          onBack={() => setCurrentView('form')}
          onUpdateToken={setToken}
          onLogout={clearToken}
        />
      );
    }

    return (
      <CandidateForm
        userEmail={user.email}
        onSettingsClick={() => setCurrentView('settings')}
      />
    );
  }

  // Fallback error state
  return (
    <div className={`p-4 bg-background ${className}`}>
      <Card className="shadow-card rounded-card">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4">
            <AlertCircleIcon />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to connect to GoGio. Please try again.
          </p>
          <Button onClick={refreshAuth} className="rounded-button font-bold">
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};