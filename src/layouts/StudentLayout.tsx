import { NavLink, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  User,
  CreditCard,
  ClipboardCheck,
  FileUp,
  BookOpen,
  LogOut,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';

interface TabItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresApproval: boolean;
}

const TABS: TabItem[] = [
  { label: 'Profile', path: ROUTES.STUDENT_PROFILE, icon: <User className="h-4 w-4" />, requiresApproval: false },
  { label: 'Payments', path: ROUTES.STUDENT_PAYMENTS, icon: <CreditCard className="h-4 w-4" />, requiresApproval: true },
  { label: 'Evaluations', path: ROUTES.STUDENT_EVALUATIONS, icon: <ClipboardCheck className="h-4 w-4" />, requiresApproval: true },
  { label: 'CV', path: ROUTES.STUDENT_CV, icon: <FileUp className="h-4 w-4" />, requiresApproval: true },
  { label: 'Tests', path: ROUTES.STUDENT_TESTS, icon: <BookOpen className="h-4 w-4" />, requiresApproval: true },
];

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isApproved = user?.isApproved ?? false;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 border-b bg-card shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <h1 className="text-lg font-bold text-primary">SMS Student</h1>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((tab) => {
              const isLocked = tab.requiresApproval && !isApproved;
              return (
                <NavLink
                  key={tab.path}
                  to={isLocked ? '#' : tab.path}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isLocked
                        ? 'cursor-not-allowed text-muted-foreground/50'
                        : isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )
                  }
                >
                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : tab.icon}
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {TABS.map((tab) => {
            const isLocked = tab.requiresApproval && !isApproved;
            return (
              <NavLink
                key={tab.path}
                to={isLocked ? '#' : tab.path}
                onClick={(e) => {
                  if (isLocked) e.preventDefault();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                    isLocked
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : isActive
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )
                }
              >
                {isLocked ? <Lock className="h-4 w-4" /> : tab.icon}
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom spacer for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
