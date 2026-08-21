'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

type StarSize = 'sm' | 'md' | 'lg';

interface ReviewStarsProps {
  rating: number;
  maxStars?: number;
  size?: StarSize;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const SIZE_MAP: Record<StarSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function ReviewStars({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}: ReviewStarsProps) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = SIZE_MAP[size];
  const display = hovered || rating;

  return (
    <div
      className="flex gap-0.5"
      onMouseLeave={() => interactive && setHovered(0)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? `Note : ${rating} sur ${maxStars}` : `${rating} sur ${maxStars} étoiles`}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={i}
            type="button"
            className={`${sizeClass} ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } transition-transform focus:outline-none`}
            onMouseEnter={() => interactive && setHovered(star)}
            onClick={() => interactive && onChange?.(star)}
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            aria-checked={interactive ? star <= rating : undefined}
            role={interactive ? 'radio' : undefined}
          >
            <Star
              className={`${sizeClass} ${
                filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default ReviewStars;
