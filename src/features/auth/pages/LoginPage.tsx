import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
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
        <Card className="shadow-lg shadow-primary/[0.04]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
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
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loginMutation.isPending}
              >
                {!loginMutation.isPending && <LogIn className="mr-2 h-4 w-4" />}
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  to={ROUTES.SIGNUP}
                  className="text-primary hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
    </AuthLayout>
  );
}
