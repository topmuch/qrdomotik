'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LinkModuleProps {
  content: any;
  slug: string;
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
  const url = content?.url || '#';

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

        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
