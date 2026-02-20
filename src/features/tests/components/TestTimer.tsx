import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
}

export function TestTimer({ durationMinutes, onTimeUp }: TestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, handleTimeUp]);

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
