import { Skeleton } from '@/components/ui/skeleton';

export function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-8">
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
