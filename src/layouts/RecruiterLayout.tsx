import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Users, ListChecks, LogOut, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-bold text-primary whitespace-nowrap">Training2Expert Recruiter</h1>

          {/* Desktop pill toggle (sliding indicator) */}
          <nav className="hidden flex-1 items-center justify-center sm:flex">
            <div className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/60 p-1 shadow-inner">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'text-white' : 'text-indigo-700 hover:bg-white/70',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="recruiter-tab-pill"
                        className="absolute inset-0 rounded-full bg-indigo-600 shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {item.icon}
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop hamburger menu (hover/click reveals name + logout) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
                  aria-label="User menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.name && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="text-xs text-muted-foreground">Signed in as</div>
                      <div className="truncate text-sm font-medium">{user.name}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setShowLogout(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sheet menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b border-border/50 px-4 py-4">
            <SheetTitle className="text-lg text-primary">Training2Expert Recruiter</SheetTitle>
            {user?.name && (
              <SheetDescription className="text-xs">{user.name}</SheetDescription>
            )}
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border/50 p-3">
            <button
              onClick={() => { setMobileMenuOpen(false); setShowLogout(true); }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
