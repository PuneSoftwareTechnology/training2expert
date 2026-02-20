import { NavLink, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Users, ListChecks, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';

const NAV_ITEMS = [
  { label: 'Candidates', path: ROUTES.RECRUITER_CANDIDATES, icon: <Users className="h-4 w-4" /> },
  { label: 'Shortlist', path: ROUTES.RECRUITER_SHORTLIST, icon: <ListChecks className="h-4 w-4" /> },
];

interface RecruiterLayoutProps {
  children: ReactNode;
}

export function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-bold text-primary">SMS Recruiter</h1>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
