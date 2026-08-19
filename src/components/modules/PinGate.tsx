'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, XCircle, Loader2 } from 'lucide-react';

interface PinGateProps {
  slug: string;
  onUnlock: (contentJson: string) => void;
}

export function PinGate({ slug, onUnlock }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/r/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.success) {
        onUnlock(data.data.contentJson || '{}');
      } else {
        setError(data.error || 'PIN incorrect');
        setPin('');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <Lock className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
          Accès protégé
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Entrez le code PIN à 4 chiffres
        </p>

        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-14 rounded-xl border-2 text-center text-2xl font-mono font-bold flex items-center justify-center transition-all duration-200 ${
                  pin[i]
                    ? 'border-slate-900 bg-slate-900 text-white scale-105'
                    : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
                }`}
              >
                {pin[i] ? '●' : ''}
              </div>
            ))}
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(v);
              setError('');
              if (v.length === 4) {
                // Auto-submit when 4 digits
                setTimeout(() => handleSubmit(), 150);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            className="sr-only"
            autoFocus
          />

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 text-sm animate-in fade-in duration-200">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={pin.length < 4 || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Déverrouiller
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Demandez le code au propriétaire du logement
        </p>
      </div>
    </div>
  );
}
