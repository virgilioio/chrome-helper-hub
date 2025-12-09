import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoGioLogo } from './GoGioLogo';
import { Loader2, AlertTriangle, LogIn } from 'lucide-react';

interface TokenSetupProps {
  onConnect: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const TokenSetup: React.FC<TokenSetupProps> = ({ onConnect, isLoading, error }) => {
  const handleConnect = async () => {
    await onConnect();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-[340px]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <GoGioLogo size="lg" />
          </div>
          <CardTitle>
            Connect to GoGio<span className="text-lilac-frost">.</span>
          </CardTitle>
          <CardDescription>
            Sign in to your GoGio account to start adding candidates directly from LinkedIn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive-bg px-3 py-2.5 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleConnect}
            variant="virgilio"
            className="w-full tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Connect with GoGio
              </>
            )}
          </Button>

          <p className="text-xs text-center text-text-secondary">
            You'll be redirected to sign in to your GoGio account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
