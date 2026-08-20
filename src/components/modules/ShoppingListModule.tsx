'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ShoppingListModuleProps {
  content: any;
  slug: string;
}

interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
}

export function ShoppingListModule({ content, slug }: ShoppingListModuleProps) {
  const initialItems: ShoppingItem[] = Array.isArray(content?.items)
    ? content.items
    : [];

  const [localItems, setLocalItems] = useState<ShoppingItem[]>(initialItems);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const toggleItem = (item: ShoppingItem) => {
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

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-rose-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <ShoppingCart className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-rose-700">
                Liste de courses
              </h2>
            </div>
            {totalCount > 0 && (
              <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                <Check className="h-3 w-3 mr-1" />
                {checkedCount}/{totalCount}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              La liste est vide
            </p>
          ) : (
            <div className="space-y-2">
              {localItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-rose-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item)}
                    className="border-rose-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <span
                    className={`text-sm flex-1 transition-all ${
                      item.checked
                        ? 'line-through text-muted-foreground'
                        : 'text-gray-800'
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