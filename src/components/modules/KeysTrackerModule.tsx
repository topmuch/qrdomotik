'use client';

import { useEffect, useState, useCallback } from 'react';
import { KeyRound, MapPin, ArrowRightLeft, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface KeysTrackerModuleProps {
  content: any;
  slug: string;
}

interface KeyItem {
  id: string;
  name: string;
  description?: string;
  lastLocation?: string;
  lastSeenAt?: string;
  borrowedBy?: string;
  isBorrowed: boolean;
}

export function KeysTrackerModule({ content, slug }: KeysTrackerModuleProps) {
  const [items, setItems] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [toggling, setToggling] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/modules/${slug}/keys`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });

    fetchKeys();
  }, [slug, fetchKeys]);

  const handleToggle = (item: KeyItem) => {
    if (item.isBorrowed) {
      // Return key - no form needed
      setToggling(true);
      fetch(`/api/modules/${slug}/keys`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, isBorrowed: false, borrowedBy: '' }),
      })
        .then(() => fetchKeys())
        .catch(() => {})
        .finally(() => setToggling(false));

      fetch(`/api/r/${slug}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'item_checked', detailsJson: JSON.stringify({ id: item.id }) }),
      });
    } else {
      // Borrow key - show form
      setToggleId(item.id);
      setBorrowerName('');
    }
  };

  const handleConfirmBorrow = async () => {
    if (!toggleId || !borrowerName.trim()) return;
    setToggling(true);
    try {
      await fetch(`/api/modules/${slug}/keys`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: toggleId, isBorrowed: true, borrowedBy: borrowerName.trim() }),
      });

      fetch(`/api/r/${slug}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'item_checked', detailsJson: JSON.stringify({ id: toggleId }) }),
      });

      setToggleId(null);
      setBorrowerName('');
      await fetchKeys();
    } catch {
      // silencieux
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-amber-700 dark:text-amber-300">
                Traçabilité des clés
              </h2>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune clé enregistrée
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </span>
                    </div>
                    <Badge
                      variant={item.isBorrowed ? 'destructive' : 'outline'}
                      className={`shrink-0 ${
                        !item.isBorrowed
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : ''
                      }`}
                    >
                      {item.isBorrowed ? 'Emprunté' : 'Disponible'}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground pl-6">
                      {item.description}
                    </p>
                  )}

                  {item.isBorrowed && item.borrowedBy && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 pl-6">
                      Emprunté par : <strong>{item.borrowedBy}</strong>
                    </p>
                  )}

                  {item.lastLocation && (
                    <div className="flex items-center gap-1 pl-6">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {item.lastLocation}
                      </span>
                    </div>
                  )}

                  {toggleId === item.id ? (
                    <div className="flex items-center gap-2 pl-6 pt-1">
                      <Input
                        placeholder="Nom de l'emprunteur"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="h-8 text-xs border-amber-200 focus-visible:ring-amber-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        onClick={handleConfirmBorrow}
                        disabled={!borrowerName.trim() || toggling}
                      >
                        OK
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0"
                        onClick={() => setToggleId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="pl-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
                        onClick={() => handleToggle(item)}
                        disabled={toggling}
                      >
                        {toggling ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="mr-1 h-3 w-3" />
                        )}
                        {item.isBorrowed ? 'Rendre' : 'Emprunter'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
