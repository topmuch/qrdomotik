'use client';

import { Shield, ShieldCheck } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md';
}

export function VerificationBadge({ isVerified, size = 'sm' }: VerificationBadgeProps) {
  const isSmall = size === 'sm';

  if (isVerified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${
          isSmall
            ? 'bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px]'
            : 'bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs'
        }`}
      >
        <ShieldCheck className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        <span>Vérifié</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        isSmall
          ? 'bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[10px]'
          : 'bg-slate-100 text-slate-500 px-2.5 py-1 text-xs'
      }`}
    >
      <Shield className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>Non vérifié</span>
    </span>
  );
}
