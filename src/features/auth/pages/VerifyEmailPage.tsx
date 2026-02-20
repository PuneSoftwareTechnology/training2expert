import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';
import { ROUTES } from '@/constants/routes';
import { PageTransition } from '@/components/animations/PageTransition';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(getErrorMessage(error));
      });
  }, [token]);

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-lg font-medium text-foreground">{message}</p>
                <Button asChild className="mt-2">
                  <Link to={ROUTES.LOGIN}>Go to Login</Link>
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium text-foreground">{message}</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link to={ROUTES.LOGIN}>Back to Login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
