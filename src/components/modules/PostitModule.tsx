'use client';

import { useEffect } from 'react';
import { StickyNote } from 'lucide-react';

interface PostitModuleProps {
  content: any;
  slug: string;
}

const colorMap: Record<string, string> = {
  yellow: 'bg-amber-100',
  pink: 'bg-pink-100',
  blue: 'bg-blue-100',
  green: 'bg-emerald-100',
  purple: 'bg-purple-100',
};

export function PostitModule({ content, slug }: PostitModuleProps) {
  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });
  }, [slug]);

  const message = content?.message || '';
  const color = content?.color || 'yellow';
  const bgClass = colorMap[color] || colorMap.yellow;

  return (
    <div className="max-w-md mx-auto">
      <div
        className={`${bgClass} rounded-2xl p-6 shadow-md`}
      >
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            Post-it
          </span>
        </div>
        <p className="text-xl leading-relaxed whitespace-pre-wrap text-gray-800">
          {message}
        </p>
      </div>
    </div>
  );
}
