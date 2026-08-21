'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, Plus, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EnergyCounterModuleProps {
  content: any;
  slug: string;
}

interface Reading {
  id: string;
  value: number;
  date: string;
}

export function EnergyCounterModule({ content, slug }: EnergyCounterModuleProps) {
  const meterId = content?.meterId || '';
  const provider = content?.provider || '';
  const currentReading = content?.currentReading ?? null;
  const unit = content?.unit || 'kWh';
  const notes = content?.notes || '';

  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await fetch(`/api/modules/${slug}/energy`);
      if (res.ok) {
        const data = await res.json();
        setReadings(Array.isArray(data) ? data : data.readings || []);
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

    fetchReadings();
  }, [slug, fetchReadings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue);
    if (isNaN(val)) return;

    setSubmitting(true);
    try {
      await fetch(`/api/modules/${slug}/energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val, date: newDate }),
      });

      fetch(`/api/r/${slug}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'item_added' }),
      });

      setNewValue('');
      setNewDate(new Date().toISOString().split('T')[0]);
      await fetchReadings();
    } catch {
      // silencieux
    } finally {
      setSubmitting(false);
    }
  };

  const displayReading = readings.length > 0 ? readings[0].value : currentReading;
  const latestReading = readings.length > 0 ? readings[0] : null;
  const previousReading = readings.length > 1 ? readings[1] : null;
  const delta = latestReading && previousReading ? latestReading.value - previousReading.value : null;

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
      <Card className="border-teal-200 dark:border-teal-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
              <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-teal-700 dark:text-teal-300">
                Compteur d'énergie
              </h2>
              {provider && (
                <p className="text-xs text-muted-foreground">{provider}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Current reading */}
          <div className="text-center py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Relevé actuel
            </p>
            <p className="text-4xl font-bold text-teal-700 dark:text-teal-300">
              {displayReading !== null ? displayReading.toLocaleString('fr-FR') : '—'}
            </p>
            <Badge variant="outline" className="mt-1.5 border-teal-300 text-teal-600 dark:border-teal-700 dark:text-teal-400">
              {unit}
            </Badge>
          </div>

          {meterId && (
            <p className="text-xs text-muted-foreground text-center">
              N° compteur : {meterId}
            </p>
          )}

          {delta !== null && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 p-3">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-teal-700 dark:text-teal-300">
                Conso depuis dernier relevé : <strong>{delta.toLocaleString('fr-FR')} {unit}</strong>
              </span>
            </div>
          )}

          {notes && (
            <p className="text-xs text-muted-foreground text-center italic">
              {notes}
            </p>
          )}

          <Separator />

          {/* Add reading form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Ajouter un relevé
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Valeur"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="border-teal-200 focus-visible:ring-teal-500"
                required
              />
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border-teal-200 focus-visible:ring-teal-500 w-auto"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !newValue}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Ajouter le relevé
            </Button>
          </form>

          <Separator />

          {/* History */}
          <div>
            <h3 className="text-sm font-semibold text-teal-600 dark:text-teal-400 mb-3">
              Historique
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
              </div>
            ) : readings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun historique de relevés
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {readings.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-teal-100 dark:border-teal-900 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-teal-500" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.date)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {r.value.toLocaleString('fr-FR')} {unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
