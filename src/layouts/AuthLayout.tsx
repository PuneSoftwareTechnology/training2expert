import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { PageTransition } from '@/components/animations/PageTransition';

interface AuthLayoutProps {
  children: ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: UserPlus,
    title: 'Enquiries to enrollments',
    description: 'Capture every lead and convert it into an enrolled student without re-typing a thing.',
  },
  {
    icon: GraduationCap,
    title: 'Courses, batches & trainers',
    description: 'Plan courses, assign trainers to batches and keep schedules in one place.',
  },
  {
    icon: Wallet,
    title: 'Fees & trainer payouts',
    description: 'Track dues, record payments and reconcile trainer payouts month by month.',
  },
  {
    icon: BarChart3,
    title: 'Placements & live reports',
    description: 'Evaluations, CVs, recruiter shortlists and figures that update as you work.',
  },
] as const;

const ROLES = ['Students', 'Admins', 'Trainers', 'Recruiters'] as const;

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <span className="block text-lg font-bold tracking-tight">Training2Expert</span>
          <span className="block text-xs text-muted-foreground">Training &amp; placement management</span>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand / product panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-sidebar-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Training2Expert</span>
        </div>

        <div className="relative max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-4xl font-bold leading-[1.15] tracking-tight"
          >
            Everything your training institute runs on,
            <span className="text-sidebar-primary"> in one place.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: 'easeOut' }}
            className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground/70"
          >
            From the first enquiry to the final placement — students, courses, batches, fees and
            reports, managed by one team on one platform.
          </motion.p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((item, index) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 + index * 0.07, ease: 'easeOut' }}
                className="flex gap-3.5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary ring-1 ring-sidebar-border">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-sidebar-foreground/60">
                    {item.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((role) => (
              <span
                key={role}
                className="rounded-full border border-sidebar-border bg-sidebar-accent/60 px-3 py-1 text-xs font-medium text-sidebar-foreground/80"
              >
                {role}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-sidebar-foreground/55">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role-based access — you only ever see what your role allows.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-8">
        {/* Ambient colour wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              'radial-gradient(120% 90% at 8% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)',
              'radial-gradient(90% 70% at 100% 12%, color-mix(in oklab, var(--chart-3) 20%, transparent), transparent 58%)',
              'radial-gradient(85% 70% at 90% 100%, color-mix(in oklab, var(--chart-4) 12%, transparent), transparent 62%)',
              'radial-gradient(85% 65% at 0% 100%, color-mix(in oklab, var(--chart-2) 20%, transparent), transparent 62%)',
            ].join(', '),
          }}
        />
        {/* Soft light blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-primary/25 blur-[90px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-chart-3/25 blur-[90px]"
        />
        {/* Fine grid, faded out toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-primary opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at 50% 45%, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black, transparent 70%)',
          }}
        />

        <div className="relative z-10 w-full max-w-lg">
          <PageTransition>
            {/* Glow sitting directly behind the card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-chart-3/15 to-chart-4/20 blur-2xl"
            />
            <BrandMark className="mb-8 flex justify-center lg:hidden" />
            {children}

            {/* Compact product summary — the brand panel is hidden on small screens */}
            <div className="mt-8 lg:hidden">
              <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                One platform for your institute
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-sm shadow-primary/5 backdrop-blur-sm"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-medium text-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need help signing in? Reach out to your institute administrator.
            </p>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
