'use client';

import { QrCode } from 'lucide-react';

interface InactiveQrProps {
  qrName?: string;
  homeName?: string;
}

export function InactiveQr({ qrName, homeName }: InactiveQrProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <QrCode className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-300">
          QR Code désactivé
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Ce QR code n&apos;est plus accessible.
        </p>
        {qrName && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{qrName}</span>
            {homeName && (
              <>
                {' '}&middot; {homeName}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
