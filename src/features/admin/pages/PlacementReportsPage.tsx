import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { COURSES, PLACEMENT_STATUSES } from '@/constants/courses';
import type { PlacementRow } from '@/types/admin.types';

const FILTER_SELECTS = [
  { label: 'Course', key: 'course' as const, options: COURSES.map((c) => ({ value: c, label: c })) },
  { label: 'Status', key: 'status' as const, options: PLACEMENT_STATUSES.map((s) => ({ ...s })) },
];

const columns: ColumnDef<PlacementRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  { accessorKey: 'course', header: 'Course' },
  {
    accessorKey: 'placementStatus', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<string>();
      return <Badge variant={s === 'PLACED' ? 'default' : 'secondary'}>{s === 'PLACED' ? 'Placed' : 'Not Placed'}</Badge>;
    },
  },
  { accessorKey: 'companyName', header: 'Company', cell: ({ getValue }) => getValue<string>() ?? '-' },
];

export default function PlacementReportsPage() {
  const [filters, setFilters] = useState({ course: '', status: '' });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', 'placement', filters],
    queryFn: () => adminService.getPlacementReport({
      course: filters.course || undefined,
      status: filters.status || undefined,
    }),
  });

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Placement Reports</h2>

        <div className="flex gap-4">
          {FILTER_SELECTS.map(({ label, key, options }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Select value={filters[key]} onValueChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={data ?? []} emptyMessage="No data" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
