import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoGioLogo } from './GoGioLogo';
import { Loader2, Key, ExternalLink, AlertTriangle } from 'lucide-react';

interface TokenSetupProps {
  onSubmit: (token: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const TokenSetup: React.FC<TokenSetupProps> = ({ onSubmit, isLoading, error }) => {
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      await onSubmit(token.trim());
    }
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
            Enter your API token to start adding candidates directly from LinkedIn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token" className="text-sm font-medium text-text-secondary font-inter">
                API Token
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  id="token"
                  type="password"
                  placeholder="Paste your token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive-bg px-3 py-2.5 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="virgilio"
              className="w-full tracking-wide"
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to GoGio'
              )}
            </Button>

            <div className="text-center pt-1">
              <a
                href="https://app.gogio.io/settings?tab=integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-secondary hover:text-primary inline-flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                Where do I find my token?
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
