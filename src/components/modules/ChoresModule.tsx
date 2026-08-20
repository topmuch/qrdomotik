'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ChoresModuleProps {
  content: any;
  slug: string;
}

interface Chore {
  id: string;
  title: string;
  points: number;
  completed?: boolean;
}

export function ChoresModule({ content, slug }: ChoresModuleProps) {
  const initialChores: Chore[] = Array.isArray(content?.chores)
    ? content.chores
    : [];

  const [localChores, setLocalChores] = useState<Chore[]>(initialChores);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const toggleChore = (chore: Chore) => {
    const newCompleted = !chore.completed;
    setLocalChores((prev) =>
      prev.map((c) =>
        c.id === chore.id ? { ...c, completed: newCompleted } : c
      )
    );

    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType: 'chore_completed',
        detailsJson: JSON.stringify({ id: chore.id }),
      }),
    });
  };

  const totalPoints = localChores
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + (c.points || 0), 0);

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-fuchsia-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-100">
                <Star className="h-5 w-5 text-fuchsia-600" />
              </div>
              <h2 className="text-xl font-bold text-fuchsia-700">
                Tâches à accomplir
              </h2>
            </div>
            <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200">
              <Star className="h-3 w-3 mr-1" />
              {totalPoints} pts
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {localChores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche configurée
            </p>
          ) : (
            <div className="space-y-2">
              {localChores.map((chore) => (
                <label
                  key={chore.id}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-fuchsia-50 cursor-pointer transition-colors border border-fuchsia-100"
                >
                  <Checkbox
                    checked={!!chore.completed}
                    onCheckedChange={() => toggleChore(chore)}
                    className="border-fuchsia-300 data-[state=checked]:bg-fuchsia-600 data-[state=checked]:border-fuchsia-600"
                  />
                  <span
                    className={`text-sm flex-1 transition-all ${
                      chore.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-gray-800'
                    }`}
                  >
                    {chore.title}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${
                      chore.completed
                        ? 'bg-fuchsia-100 text-fuchsia-500'
                        : 'bg-fuchsia-100 text-fuchsia-700'
                    }`}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {chore.points} pts
                  </Badge>
                </label>
              ))}
            </div>
          )}

          {content?.rewardMessage && (
            <div className="mt-4 rounded-lg bg-fuchsia-50 border border-fuchsia-200 p-3">
              <p className="text-sm text-fuchsia-700">
                <Star className="h-4 w-4 inline mr-1" />
                {content.rewardMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
