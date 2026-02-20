import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';
import { ROUTES } from '@/constants/routes';
import { PageTransition } from '@/components/animations/PageTransition';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success('Reset code sent to your email');
      navigate(ROUTES.RESET_PASSWORD);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutation.mutate(data);
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a reset code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  'Sending...'
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Code
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
