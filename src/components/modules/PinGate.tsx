'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

interface PinGateProps {
  onUnlock: () => void;
}

export function PinGate({ onUnlock }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Le parent vérifiera le PIN via l'API
    onUnlock();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-200 flex items-center justify-center">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Accès protégé</h1>
        <p className="text-sm text-muted-foreground mb-6">Entrez le code PIN à 4 chiffres</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-14 rounded-xl border-2 text-center text-2xl font-mono font-bold flex items-center justify-center transition-colors ${
                  pin[i] ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                {pin[i] ? '•' : ''}
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
              setError(false);
              if (v.length === 4) {
                // Soumet automatiquement
              }
            }}
            className="sr-only"
            autoFocus
          />
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              Code incorrect
            </div>
          )}
        </form>

        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={pin.length < 4}
          onClick={() => onUnlock()}
        >
          <Lock className="w-4 h-4 mr-2" />
          Déverrouiller
        </Button>
      </div>
    </div>
  );
}
