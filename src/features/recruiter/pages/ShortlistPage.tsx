import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent } from '@/components/ui/card';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterService } from '@/services/recruiter.service';
import { formatDate } from '@/utils/format';
import type { RecruiterShortlist } from '@/types/student.types';

const columns: ColumnDef<RecruiterShortlist>[] = [
  {
    accessorKey: 'studentName',
    header: ({ column }) => <SortableHeader column={column} title="Student Name" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  { accessorKey: 'course', header: 'Course' },
  {
    accessorKey: 'dateOfShortlist',
    header: ({ column }) => <SortableHeader column={column} title="Date Shortlisted" />,
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

export default function ShortlistPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruiter', 'shortlist'],
    queryFn: recruiterService.getShortlist,
  });

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Shortlist</h2>

        {isLoading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No candidates shortlisted yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={data} emptyMessage="No candidates shortlisted yet" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
