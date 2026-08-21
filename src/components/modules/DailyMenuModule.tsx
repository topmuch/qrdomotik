'use client';

import { useEffect } from 'react';
import { Coffee, UtensilsCrossed, Cookie, Moon, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DailyMenuModuleProps {
  content: any;
  slug: string;
}

interface Meal {
  id: string;
  meal: 'petit-dejeuner' | 'dejeuner' | 'gouter' | 'diner';
  dish: string;
  notes?: string;
}

const mealConfig: Record<string, { label: string; icon: React.ElementType }> = {
  'petit-dejeuner': { label: 'Petit-déjeuner', icon: Coffee },
  'dejeuner': { label: 'Déjeuner', icon: UtensilsCrossed },
  'gouter': { label: 'Goûter', icon: Cookie },
  'diner': { label: 'Dîner', icon: Moon },
};

const mealOrder = ['petit-dejeuner', 'dejeuner', 'gouter', 'diner'];

function formatFrenchDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function DailyMenuModule({ content, slug }: DailyMenuModuleProps) {
  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const date = content?.date || '';
  const meals: Meal[] = Array.isArray(content?.meals) ? content.meals : [];

  const groupedMeals = mealOrder
    .filter((type) => meals.some((m) => m.meal === type))
    .map((type) => ({
      type,
      items: meals.filter((m) => m.meal === type),
    }));

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <CalendarDays className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-orange-700 dark:text-orange-300">
                Menu du jour
              </h2>
            </div>
          </div>
          {date && (
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {formatFrenchDate(date)}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {groupedMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun menu configuré
            </p>
          ) : (
            <div className="space-y-4">
              {groupedMeals.map((group, idx) => {
                const config = mealConfig[group.type];
                const Icon = config.icon;
                return (
                  <div key={group.type}>
                    {idx > 0 && <Separator className="my-4" />}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-orange-500" />
                        <Badge
                          variant="outline"
                          className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <div className="pl-6 space-y-1.5">
                        {group.items.map((item) => (
                          <div key={item.id}>
                            <p className="text-sm font-medium text-foreground">
                              {item.dish}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
