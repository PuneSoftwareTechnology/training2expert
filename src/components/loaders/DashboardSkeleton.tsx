import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="space-y-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <SectionSkeleton cards={4} />
      <SectionSkeleton cards={4} />
      <SectionSkeleton cards={3} />
      <SectionSkeleton cards={4} />
      <SectionSkeleton cards={4} />
      <SectionSkeleton cards={3} />
    </div>
  );
}
