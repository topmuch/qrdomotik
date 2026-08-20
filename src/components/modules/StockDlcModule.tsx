'use client';

import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StockDlcModuleProps {
  content: any;
  slug: string;
}

export function StockDlcModule({ content, slug }: StockDlcModuleProps) {
  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-lime-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-100">
              <Package className="h-5 w-5 text-lime-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-lime-700">
                Gestion de stock
              </h2>
              {content?.homeName && (
                <p className="text-xs text-lime-600 mt-0.5 truncate">
                  {content.homeName}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-lime-50 border border-lime-200 p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-lime-500 shrink-0 mt-0.5" />
              <p className="text-sm text-lime-800 leading-relaxed">
                Gestion de stock — Accédez au dashboard pour gérer vos produits et alertes de péremption.
              </p>
            </div>
          </div>

          {content?.summary && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.isArray(content.summary) ? (
                content.summary.map((item: any, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-lime-100 text-lime-700"
                  >
                    {typeof item === 'string' ? item : item.label || item.text || JSON.stringify(item)}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-lime-100 text-lime-700"
                >
                  {content.summary}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
