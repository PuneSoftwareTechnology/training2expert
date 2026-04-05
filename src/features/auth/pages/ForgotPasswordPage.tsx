import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';
import { ROUTES } from '@/constants/routes';
import { AuthLayout } from '@/layouts/AuthLayout';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

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
      setIsSuccess(true);
      toast.success('Reset link sent to your email');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setSubmittedEmail(data.email);
    mutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card className="shadow-lg shadow-primary/[0.04]">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to <span className="font-medium text-foreground">{submittedEmail}</span>. Please check your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or make sure your account is approved.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="shadow-lg shadow-primary/[0.04]">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
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
              loading={mutation.isPending}
            >
              {!mutation.isPending && <Mail className="mr-2 h-4 w-4" />}
              {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
