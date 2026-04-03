import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { PageTransition } from '@/components/animations/PageTransition';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] px-4">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Training2Expert</span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </PageTransition>
  );
}
