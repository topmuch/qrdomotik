'use client';

import { useEffect } from 'react';
import { ExternalLink, Globe, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LinkModuleProps {
  content: any;
  slug: string;
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function LinkModule({ content, slug }: LinkModuleProps) {
  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const title = content?.title || 'Lien';
  const description = content?.description || '';
  const url = content?.url || '';
  const valid = isValidUrl(url);
  const domain = extractDomain(url);

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <ExternalLink className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-violet-700 dark:text-violet-300">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {url && (
            <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/30 p-3">
              {domain ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  alt=""
                  className="h-6 w-6 rounded"
                  width={24}
                  height={24}
                />
              ) : (
                <Globe className="h-6 w-6 text-violet-400" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  <span className="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">
                    {domain}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {url}
                </p>
              </div>
            </div>
          )}

          {!valid && url ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive">URL invalide</span>
            </div>
          ) : (
            <Button
              asChild
              size="lg"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Ouvrir le lien
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
