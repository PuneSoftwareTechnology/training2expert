import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRouter } from './router';
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Providers>
          <AppRouter />
        </Providers>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
