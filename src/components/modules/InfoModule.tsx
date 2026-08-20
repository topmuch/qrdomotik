'use client';

import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface InfoModuleProps {
  content: any;
  slug: string;
}

export function InfoModule({ content, slug }: InfoModuleProps) {
  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const title = content?.title || 'Informations';
  const body = content?.body || '';

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
              <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              {title}
            </h1>
          </div>
        </CardHeader>

        <CardContent>
 <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {body}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
