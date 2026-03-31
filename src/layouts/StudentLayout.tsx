import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogOut,
  Layers,
  CheckCircle2,
  Clock,
  Menu,
  Pencil,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/constants/routes";
import { SIDEBAR_ITEMS } from "@/constants/roles";
import { studentService } from "@/services/student.service";
import type { StudentProfileFull } from "@/types/student.types";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const profileData = queryClient.getQueryData<StudentProfileFull>([
    "student",
    "profile",
  ]);
  const isVerified = profileData?.enrollmentStatus === "APPROVED";
  const [showLogout, setShowLogout] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // If on a route-based page (e.g. /student/tests), reflect that in activeSection
  const isTestsRoute = location.pathname.startsWith("/student/tests");
  const currentActive = isTestsRoute ? "tests" : activeSection;
  const [showTestDialog, setShowTestDialog] = useState(false);
  const testDialogShownRef = useRef(false);

  // Fetch available tests in background
  const { data: availableTests, isLoading: testsLoading } = useQuery({
    queryKey: ["student", "tests"],
    queryFn: studentService.getAvailableTests,
    staleTime: 5 * 60 * 1000,
  });

  // Show Tests nav: while loading (avoid flash), when tests exist, or if already on tests route
  const hasTests =
    testsLoading ||
    (availableTests && availableTests.length > 0) ||
    isTestsRoute;
  const visibleSidebarItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.id === "tests") return hasTests;
    return true;
  });

  // Show test notification dialog once per session when tests are available
  useEffect(() => {
    if (
      availableTests &&
      availableTests.length > 0 &&
      !testDialogShownRef.current &&
      !sessionStorage.getItem("test-notification-dismissed")
    ) {
      testDialogShownRef.current = true;
      setShowTestDialog(true);
    }
  }, [availableTests]);

  const handleTestDialogDismiss = () => {
    setShowTestDialog(false);
    sessionStorage.setItem("test-notification-dismissed", "true");
  };

  const handleGoToTest = () => {
    setShowTestDialog(false);
    sessionStorage.setItem("test-notification-dismissed", "true");
    if (availableTests && availableTests.length === 1) {
      navigate(`/student/tests/${availableTests[0].id}`);
    } else {
      navigate("/student/tests");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const isScrollingRef = useRef(false);

  const handleNavClick = (item: (typeof SIDEBAR_ITEMS)[number]) => {
    // Route-based items navigate to a different page
    if ("route" in item && item.route) {
      navigate(item.route as string);
      return;
    }
    // Section-based items scroll within the profile page
    if (isTestsRoute) {
      // If we're on the tests route, navigate back to profile first
      navigate("/student/profile");
      // Let the profile page load, then scroll
      setTimeout(() => {
        const el = document.getElementById(`section-${item.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else {
      setActiveSection(item.id);
      isScrollingRef.current = true;
      const el = document.getElementById(`section-${item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  // Scroll spy: find which section's top is closest to (but above) viewport top
  const updateActiveFromScroll = useCallback(() => {
    if (isScrollingRef.current || isTestsRoute) return;

    const sectionIds = visibleSidebarItems
      .filter((item) => !("route" in item && item.route))
      .map((item) => item.id);

    const offset = 100; // account for mobile header
    let currentId: string | null = null;

    for (const id of sectionIds) {
      const el = document.getElementById(`section-${id}`);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= offset) {
        currentId = id;
      }
    }

    // If no section has scrolled past the offset, pick the first one
    if (!currentId && sectionIds.length > 0) {
      currentId = sectionIds[0];
    }

    if (currentId) {
      setActiveSection(currentId);
    }
  }, [visibleSidebarItems, isTestsRoute]);

  useEffect(() => {
    if (isTestsRoute) return;

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    // Run once on mount to set initial state
    updateActiveFromScroll();
    return () => window.removeEventListener("scroll", updateActiveFromScroll);
  }, [updateActiveFromScroll, isTestsRoute]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col lg:w-64">
        <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                Student Management System
              </span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Student
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 pt-4 ">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? `${item.iconBg} text-white shadow-md`
                        : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="border-t border-white/10 px-3 py-3">
            <button
              onClick={() => setShowLogout(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <LogOut className="h-4 w-4" />
              </div>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Top Header ─── */}
      <header className="fixed inset-x-0 top-0 z-30 md:hidden">
        <div className="flex h-14 items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-base font-extrabold uppercase tracking-wide">
                {user?.name || "Student"}
              </span>
            </div>
            {isVerified ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-100 backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 bg-white/15 text-white hover:bg-white/25"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
              <DropdownMenuItem
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("toggle-profile-edit"))
                }
                className="gap-2.5 px-3 py-2.5 font-medium text-blue-700 focus:bg-blue-50 focus:text-blue-700 dark:text-blue-400 dark:focus:bg-blue-950/30"
              >
                <div className="flex h-7 w-7 items-center justify-center  bg-gradient-to-br text-white shadow-sm">
                  <Pencil className="h-3.5 w-3.5" />
                </div>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowLogout(true)}
                className="gap-2.5 rounded-lg px-3 py-2.5 font-medium text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/30"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div className="mx-2 mb-2 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 px-2 pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-slate-900/40">
          <div className="flex items-center justify-around py-2.5">
            {visibleSidebarItems.map((item) => {
              const MobileIcon = item.mobileIcon;
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="relative flex flex-col items-center gap-1 px-3 py-1"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="mobile-tab-bg"
                        className={cn(
                          "absolute -inset-2.5 rounded-2xl bg-gradient-to-br",
                          item.color,
                        )}
                        style={{ opacity: 0.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <motion.div
                      animate={
                        isActive ? { scale: 1.2, y: -3 } : { scale: 1, y: 0 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                      }}
                    >
                      <MobileIcon
                        className={cn(
                          "relative z-10 h-5.5 w-5.5 transition-colors duration-200",
                          isActive ? "text-white" : "text-slate-500",
                        )}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </motion.div>
                  </div>
                  <motion.span
                    animate={isActive ? { opacity: 1 } : { opacity: 0.45 }}
                    className={cn(
                      "text-[10px] font-semibold tracking-wide",
                      isActive ? "text-white" : "text-slate-500",
                    )}
                  >
                    {item.label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-dot"
                      className={cn(
                        "h-1 w-4 rounded-full bg-gradient-to-r",
                        item.color,
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom spacer for mobile tab bar */}
      <div className="h-24 md:hidden" />

      {/* ─── Main Content ─── */}
      <main className="flex-1 md:ml-56 lg:ml-64">
        <div className="pt-14 md:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 pb-18">
            {children}
          </div>
        </div>
      </main>

      {/* Logout confirmation */}
      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
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

      {/* Test notification dialog */}
      <Dialog open={showTestDialog} onOpenChange={(open) => !open && handleTestDialogDismiss()}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader className="items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <ClipboardList className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl">
              {availableTests?.length === 1
                ? "A Test is Available!"
                : `${availableTests?.length} Tests Available!`}
            </DialogTitle>
            <DialogDescription className="text-center">
              {availableTests?.length === 1 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {availableTests[0].title}
                  </span>{" "}
                  is ready for you. Duration: {availableTests[0].durationMinutes} min
                  {" | "}{availableTests[0].totalMarks} marks.
                </>
              ) : (
                <>
                  You have {availableTests?.length} tests waiting for you.
                  Don't miss out — take them before time runs out!
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-2">
            <Button variant="outline" onClick={handleTestDialogDismiss}>
              Later
            </Button>
            <Button onClick={handleGoToTest}>
              {availableTests?.length === 1 ? "Take Test Now" : "View Tests"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
