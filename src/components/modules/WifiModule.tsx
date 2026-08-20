'use client';

import { useEffect, useState } from 'react';
import { Wifi, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WifiModuleProps {
  content: any;
  slug: string;
}

export function WifiModule({ content, slug }: WifiModuleProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const ssid = content?.ssid || 'Réseau inconnu';
  const password = content?.password || '';
  const security = content?.security || 'WPA2';

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencieux
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <Wifi className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground">Réseau Wi-Fi</p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Nom du réseau
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {ssid}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Mot de passe
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-lg tracking-widest text-foreground">
                {password ? (showPassword ? password : '•'.repeat(password.length)) : '—'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="shrink-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
            >
              {security}
            </Badge>

            {password && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" />
                    Copier
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
