import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  QrCode,
  ListChecks,
  DollarSign,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  FileText,
  LogOut,
  Menu,
  ChevronLeft,
  Settings,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { useRole } from "@/hooks/useRole";
import { ROUTES } from "@/constants/routes";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: ROUTES.ADMIN_DASHBOARD,
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Enquiry",
    path: ROUTES.ADMIN_ENQUIRY,
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "Enrollment",
    path: ROUTES.ADMIN_ENROLLMENT,
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Candidate Reports",
    path: ROUTES.ADMIN_CANDIDATE_FILTER,
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "Fee Dues",
    path: ROUTES.ADMIN_FEE_DUES,
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    label: "Enrollment Figures",
    path: ROUTES.ADMIN_ENROLLMENT_FIGURES,
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    label: "Placement Reports",
    path: ROUTES.ADMIN_PLACEMENT_REPORTS,
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    label: "QR Code",
    path: ROUTES.ADMIN_QR_CODE,
    icon: <QrCode className="h-4 w-4" />,
    adminOnly: true, // Custom flag to hide for super admin
  },
  {
    label: "Recruiter Shortlist",
    path: ROUTES.ADMIN_RECRUITER_SHORTLIST,
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    label: "Access Management",
    path: ROUTES.ADMIN_ACCESS_MANAGEMENT,
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    label: "Tests",
    path: ROUTES.ADMIN_TESTS,
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "QR Management",
    path: ROUTES.ADMIN_QR_MANAGEMENT,
    icon: <Settings className="h-4 w-4" />,
    superAdminOnly: true,
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { isSuperAdmin } = useRole();
  const [showLogout, setShowLogout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && isSuperAdmin) return false;
    return true;
  });

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between px-4">
        {(isMobile || !sidebarCollapsed) && (
          <h1 className="text-lg font-bold text-sidebar-primary">
            SMS {isSuperAdmin ? "Super Admin" : "Admin"}
          </h1>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {sidebarCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? closeMobileMenu : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !isMobile && sidebarCollapsed && "justify-center px-2",
                )
              }
              title={!isMobile && sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {(isMobile || !sidebarCollapsed) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="p-2">
        {(isMobile || !sidebarCollapsed) && user && (
          <p className="mb-2 truncate px-3 text-xs text-sidebar-foreground/60">
            {user.name} (
            {user.role
              .replace("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            )
          </p>
        )}
        <Button
          variant="ghost"
          onClick={() => setShowLogout(true)}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive",
            !isMobile && sidebarCollapsed
              ? "justify-center px-2"
              : "justify-start gap-3 px-3",
          )}
        >
          <LogOut className="h-4 w-4" />
          {(isMobile || !sidebarCollapsed) && <span>Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarCollapsed ? 64 : 256 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* Mobile header */}
      {isMobile && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-sidebar px-4 text-sidebar-foreground">
          <h1 className="text-lg font-bold text-sidebar-primary">
            SMS {isSuperAdmin ? "Super Admin" : "Admin"}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </header>
      )}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={closeMobileMenu}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className={cn("flex-1 overflow-auto", isMobile && "pt-14")}>
        <div className="p-6">{children}</div>
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
    </div>
  );
}
