import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoGioLogo } from './GoGioLogo';
import { Loader2, Key, ExternalLink } from 'lucide-react';

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
    <div className="min-h-[400px] flex flex-col items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-[340px] shadow-card rounded-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <GoGioLogo size="lg" />
          </div>
          <CardTitle className="font-heading text-xl">Connect to GoGio</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your API token to start adding candidates directly from LinkedIn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                API Token
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="token"
                  type="password"
                  placeholder="Paste your token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pl-10 h-11 rounded-lg"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-button font-bold"
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to GoGio'
              )}
            </Button>

            <div className="text-center pt-2">
              <a
                href="https://app.gogio.io/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
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
