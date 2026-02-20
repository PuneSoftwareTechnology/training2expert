import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schemas';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';
import { ROUTES } from '@/constants/routes';
import { PageTransition } from '@/components/animations/PageTransition';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully');
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    mutation.mutate({
      email: data.email,
      code: data.code,
      newPassword: data.newPassword,
    });
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter the code sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  placeholder="Enter the code"
                  {...register('code')}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 8 characters"
                  {...register('newPassword')}
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  'Resetting...'
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
