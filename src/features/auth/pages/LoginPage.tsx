import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { loginSchema, type LoginFormValues } from "../schemas/auth.schemas";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/services/api";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import { AuthLayout } from "@/layouts/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success("Login successful");

      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (data.user.role) {
        case ROLES.STUDENT:
          navigate(ROUTES.STUDENT_PROFILE, { replace: true });
          break;
        case ROLES.ADMIN:
        case ROLES.SUPER_ADMIN:
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          break;
        case ROLES.INTERN:
          navigate(ROUTES.ADMIN_ENQUIRY, { replace: true });
          break;
        case ROLES.RECRUITER:
          navigate(ROUTES.RECRUITER_CANDIDATES, { replace: true });
          break;
        default:
          navigate(ROUTES.LOGIN, { replace: true });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <AuthLayout>
      <Card className="gap-0 overflow-hidden border-white/60 bg-card/85 py-0 shadow-2xl shadow-primary/15 ring-1 ring-primary/5 backdrop-blur-xl dark:border-white/10">
        <div aria-hidden className="h-1 w-full bg-gradient-to-r from-primary via-chart-3 to-chart-4" />
        <CardHeader className="space-y-1 px-6 pt-7 pb-2 sm:px-9">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Training2Expert portal
          </span>
          <CardTitle className="pt-3 text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue — you&apos;ll land on the dashboard for your role.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-4 pb-8 sm:px-9">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-chart-3 shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30"
              loading={loginMutation.isPending}
            >
              {!loginMutation.isPending && <LogIn className="mr-2 h-4 w-4" />}
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>

            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">New here?</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Enrolled by your institute?{" "}
              <Link to={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
                Activate your account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
