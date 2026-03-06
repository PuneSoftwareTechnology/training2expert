import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { FEE_DUE_FILTERS } from '@/constants/courses';
import { cn } from '@/lib/utils';
import type { FeeDueRow } from '@/types/admin.types';

const columns: ColumnDef<FeeDueRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  { accessorKey: 'course', header: 'Course' },
  {
    accessorKey: 'completionStatus',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <Badge variant={status === 'COMPLETED' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      );
    },
  },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'totalFee',
    header: () => <span className="block text-right">Total Fee</span>,
    cell: ({ getValue }) => <span className="block text-right">{formatCurrency(getValue<number>())}</span>,
  },
  {
    accessorKey: 'paidAmount',
    header: () => <span className="block text-right">Paid</span>,
    cell: ({ getValue }) => <span className="block text-right text-green-600">{formatCurrency(getValue<number>())}</span>,
  },
  {
    accessorKey: 'pendingAmount',
    header: () => <span className="block text-right">Pending</span>,
    cell: ({ getValue }) => <span className="block text-right text-orange-600">{formatCurrency(getValue<number>())}</span>,
  },
  {
    accessorKey: 'daysSinceLastPayment',
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="Days Overdue" />
      </div>
    ),
    cell: ({ getValue }) => {
      const days = getValue<number>();
      return (
        <span className={cn(
          'block text-right font-semibold',
          days > 90 ? 'text-destructive' :
          days > 60 ? 'text-orange-600' : 'text-yellow-600',
        )}>
          {days}
        </span>
      );
    },
  },
];

export default function FeeDuesPage() {
  const [daysFilter, setDaysFilter] = useState(30);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', 'fee-dues', daysFilter],
    queryFn: () => adminService.getFeeDuesReport(daysFilter),
  });

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Fee Dues Report</h2>

        <div className="flex gap-2">
          {FEE_DUE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={daysFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDaysFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={8} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={data ?? []} emptyMessage="No fee dues found" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
