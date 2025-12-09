import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoGioLogo } from './GoGioLogo';
import { clearStoredPreferences } from '@/lib/chromeStorage';
import { toast } from 'sonner';
import { ArrowLeft, Key, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

interface SettingsPanelProps {
  token: string | null;
  userEmail: string;
  onBack: () => void;
  onUpdateToken: (token: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  token,
  userEmail,
  onBack,
  onUpdateToken,
  onLogout,
}) => {
  const [newToken, setNewToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const maskedToken = token ? `${token.slice(0, 8)}${'•'.repeat(24)}${token.slice(-4)}` : '';

  const handleUpdateToken = async () => {
    if (!newToken.trim()) return;
    
    setIsUpdating(true);
    const success = await onUpdateToken(newToken.trim());
    setIsUpdating(false);
    
    if (success) {
      setNewToken('');
      toast.success('Token updated successfully');
    }
  };

  const handleClearPreferences = async () => {
    await clearStoredPreferences();
    toast.success('Preferences cleared');
  };

  const handleLogout = async () => {
    await onLogout();
    toast.success('Disconnected from GoGio');
  };

  return (
    <div className="w-full max-w-[400px] max-h-[600px] overflow-y-auto bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <GoGioLogo size="sm" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Info */}
        <Card className="shadow-card rounded-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Account</CardTitle>
            <CardDescription>Connected as {userEmail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Token */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" /> Current Token
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={showToken ? token || '' : maskedToken}
                  readOnly
                  className="h-9 rounded-lg text-sm font-mono bg-muted"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Update Token */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Update Token</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Paste new token..."
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  className="h-9 rounded-lg text-sm"
                  disabled={isUpdating}
                />
                <Button
                  onClick={handleUpdateToken}
                  disabled={!newToken.trim() || isUpdating}
                  className="h-9 rounded-button font-semibold shrink-0"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="shadow-card rounded-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Preferences</CardTitle>
            <CardDescription>Manage stored settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full h-10 rounded-button font-medium"
              onClick={handleClearPreferences}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Saved Preferences
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will reset your last-used organization, job, and stage selections.
            </p>
          </CardContent>
        </Card>

        {/* Disconnect */}
        <Card className="shadow-card rounded-card border-destructive/20">
          <CardContent className="pt-4">
            <Button
              variant="destructive"
              className="w-full h-10 rounded-button font-bold"
              onClick={handleLogout}
            >
              Disconnect from GoGio
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will remove your token and log you out.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            GoGio Chrome Extension v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
