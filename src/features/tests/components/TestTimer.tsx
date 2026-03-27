import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestTimerProps {
  /** Server-controlled expiry time (ISO string). Takes priority over durationMinutes. */
  expiryTime?: string;
  /** Fallback: duration in minutes (used if expiryTime not provided) */
  durationMinutes?: number;
  onTimeUp: () => void;
}

function calcSecondsLeft(expiryTime?: string, durationMinutes?: number): number {
  if (expiryTime) {
    const diff = Math.floor((new Date(expiryTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  return (durationMinutes ?? 0) * 60;
}

export function TestTimer({ expiryTime, durationMinutes, onTimeUp }: TestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(expiryTime, durationMinutes));
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft < 60;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-mono font-semibold',
        isLow ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border bg-card',
      )}
    >
      <Clock className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
