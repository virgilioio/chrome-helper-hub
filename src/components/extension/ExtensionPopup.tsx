import React, { useState } from 'react';
import { useExtensionAuth } from '@/hooks/useExtensionAuth';
import { TokenSetup } from './TokenSetup';
import { CandidateForm } from './CandidateForm';
import { SettingsPanel } from './SettingsPanel';
import { GoGioLogo } from './GoGioLogo';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type View = 'form' | 'settings';

export const ExtensionPopup: React.FC = () => {
  const { status, user, error, token, setToken, clearToken, refreshAuth } = useExtensionAuth();
  const [currentView, setCurrentView] = useState<View>('form');

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-[360px] h-[400px] flex flex-col items-center justify-center bg-background">
        <GoGioLogo size="lg" className="mb-4" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Connecting to GoGio...</p>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="w-[360px] bg-background">
        <TokenSetup
          onSubmit={setToken}
          isLoading={false}
          error={null}
        />
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (status === 'error') {
    return (
      <div className="w-[360px] bg-background">
        <TokenSetup
          onSubmit={setToken}
          isLoading={false}
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
    <div className="w-[360px] p-4 bg-background">
      <Card className="shadow-card rounded-card">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
