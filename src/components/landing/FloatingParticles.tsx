'use client';
import { useMemo, useSyncExternalStore } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  shape: 'circle' | 'square';
  opacity: number;
}

function subscribeNoop(callback: () => void) {
  return () => {};
}

function getIsClientSnapshot() {
  return true;
}

function getIsClientServerSnapshot() {
  return false;
}

function subscribeToMotionPreference(callback: () => void) {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getMotionServerSnapshot() {
  return false;
}

export function FloatingParticles({
  count = 20,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    getIsClientSnapshot,
    getIsClientServerSnapshot
  );

  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionSnapshot,
    getMotionServerSnapshot
  );

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 12,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      opacity: 0.04 + Math.random() * 0.08,
    }));
  }, [count]);

  if (!isClient || reducedMotion) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: '#2563EB',
            opacity: p.opacity,
            animation: `float-${p.id % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(-10px) translateX(-15px) rotate(180deg); }
          75% { transform: translateY(-25px) translateX(5px) rotate(270deg); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          33% { transform: translateY(-30px) translateX(-10px) rotate(120deg); }
          66% { transform: translateY(-15px) translateX(20px) rotate(240deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(15px); }
        }
      `}</style>
    </div>
  );
}
