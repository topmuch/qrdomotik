'use client';

import { useEffect, useState } from 'react';
import { ListTodo, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TodoListModuleProps {
  content: any;
  slug: string;
}

interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
}

export function TodoListModule({ content, slug }: TodoListModuleProps) {
  const initialItems: TodoItem[] = Array.isArray(content?.items)
    ? content.items
    : [];

  const [localItems, setLocalItems] = useState<TodoItem[]>(initialItems);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const toggleItem = (item: TodoItem) => {
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
  const title = content?.title || 'To-Do List';

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-teal-200 dark:border-teal-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <ListTodo className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-teal-700 dark:text-teal-300">
                {title}
              </h2>
            </div>
            {totalCount > 0 && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
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
              <Progress value={progress} className="h-2 [&>[data-slot=indicator]]:bg-teal-500" />
            </div>
          )}

          {localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche
            </p>
          ) : (
            <div className="space-y-2">
              {localItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-teal-50 dark:hover:bg-teal-950/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item)}
                    className="border-teal-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <span
                    className={`text-sm flex-1 transition-all ${
                      item.checked
                        ? 'line-through text-muted-foreground'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
