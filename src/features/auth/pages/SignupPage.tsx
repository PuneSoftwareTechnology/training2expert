import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { signupSchema, type SignupFormValues } from '../schemas/auth.schemas';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';
import { ROUTES } from '@/constants/routes';
import { AuthLayout } from '@/layouts/AuthLayout';

export default function SignupPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: () => {
      toast.success('Account activated! You can now sign in.');
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = ({ confirmPassword: _, ...data }: SignupFormValues) => {
    signupMutation.mutate(data);
  };

  return (
    <AuthLayout>
        <Card className="shadow-lg shadow-primary/[0.04]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Activate Account</CardTitle>
            <CardDescription>Set your password to activate your student account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>You must be enrolled by an admin before you can activate your account. Use the email provided during enrollment.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Enrolled Email</Label>
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
                <Label htmlFor="password">Set Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Min 8 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
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
                loading={signupMutation.isPending}
              >
                {!signupMutation.isPending && <UserPlus className="mr-2 h-4 w-4" />}
                {signupMutation.isPending ? 'Activating...' : 'Activate Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already activated?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
    </AuthLayout>
  );
}
