'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DeepCleaningModuleProps {
  content: any;
  slug: string;
}

interface CleaningItem {
  id: string;
  text: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  lastDone?: string;
  checked: boolean;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bi-hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
};

export function DeepCleaningModule({ content, slug }: DeepCleaningModuleProps) {
  const initialItems: CleaningItem[] = Array.isArray(content?.items)
    ? content.items
    : [];

  const [localItems, setLocalItems] = useState<CleaningItem[]>(initialItems);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const toggleItem = (item: CleaningItem) => {
    setLocalItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, checked: !i.checked } : i
      )
    );

    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType: 'item_checked',
        detailsJson: JSON.stringify({ id: item.id }),
      }),
    });
  };

  const checkedCount = localItems.filter((i) => i.checked).length;
  const totalCount = localItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const title = content?.title || 'Ménage Profond';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-violet-700 dark:text-violet-300">
                {title}
              </h2>
            </div>
            {totalCount > 0 && (
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                <Check className="h-3 w-3 mr-1" />
                {checkedCount}/{totalCount}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {totalCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 [&>[data-slot=indicator]]:bg-violet-500" />
            </div>
          )}

          {localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche de ménage configurée
            </p>
          ) : (
            <div className="space-y-2">
              {localItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-violet-100 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-3"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item)}
                      className="mt-0.5 border-violet-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium transition-all ${
                          item.checked
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`
                      }
                      >
                        {item.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-violet-200 bg-violet-100/80 text-violet-600 dark:border-violet-800 dark:bg-violet-900/50 dark:text-violet-400"
                        >
                          {frequencyLabels[item.frequency] || item.frequency}
                        </Badge>
                        {item.lastDone && (
                          <span className="text-[10px] text-muted-foreground">
                            Fait le {formatDate(item.lastDone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
