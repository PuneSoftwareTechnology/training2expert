import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { INSTITUTES, MONTHS } from '@/constants/courses';
import type { EnrollmentFigureRow } from '@/types/admin.types';

export default function EnrollmentFiguresPage() {
  const currentYear = new Date().getFullYear();
  const [institute, setInstitute] = useState<string>('PST');
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', 'enrollment-figures', institute, year],
    queryFn: () => adminService.getEnrollmentFigures(institute, year),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const columns: ColumnDef<EnrollmentFigureRow>[] = useMemo(() => [
    {
      accessorKey: 'course',
      header: 'Course',
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    ...MONTHS.map((month): ColumnDef<EnrollmentFigureRow> => ({
      id: month,
      header: () => <span className="block text-center">{month}</span>,
      accessorFn: (row) => row.monthlyData[month] ?? 0,
      cell: ({ getValue }) => <span className="block text-center">{getValue<number>()}</span>,
    })),
    {
      accessorKey: 'total',
      header: () => <span className="block text-center font-bold">Total</span>,
      cell: ({ getValue }) => <span className="block text-center font-bold">{getValue<number>()}</span>,
    },
  ], []);

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Enrollment Figures</h2>

        <div className="flex gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Institute</Label>
            <Select value={institute} onValueChange={setInstitute}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={14} />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <DataTable columns={columns} data={data ?? []} pageSize={50} emptyMessage="No data available" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
