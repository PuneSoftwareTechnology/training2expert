import { useQuery } from '@tanstack/react-query';
import { ListChecks, Briefcase, Calendar, User } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { FilterActions } from '@/components/ui/filter-actions';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/utils/format';
import type { RecruiterShortlist } from '@/types/admin.types';

const columns: ColumnDef<RecruiterShortlist>[] = [
  {
    accessorKey: 'recruiterName',
    header: ({ column }) => <SortableHeader column={column} title="Recruiter" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  { accessorKey: 'course', header: 'Course' },
  { accessorKey: 'studentName', header: 'Student Name' },
  {
    accessorKey: 'dateOfShortlist',
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

export default function RecruiterShortlistPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'recruiter-shortlist'],
    queryFn: adminService.getRecruiterShortlist,
  });

  const items = data?.items ?? [];

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 shadow-md shadow-purple-200/50">
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Recruiter Shortlist</h2>
              <p className="text-sm text-muted-foreground">
                Students shortlisted by recruiters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Badge variant="outline">{data?.total ?? items.length} record{(data?.total ?? items.length) !== 1 ? 's' : ''}</Badge>
            )}
            <FilterActions
              onRefresh={() => refetch()}
              isFetching={isLoading}
              showReset={false}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No shortlist records</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Card className="border-purple-200/60 overflow-hidden">
                <CardContent className="p-0">
                  <DataTable columns={columns} data={items} emptyMessage="No shortlist records" headerClassName="bg-gradient-to-r from-purple-500 to-violet-600" />
                </CardContent>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.studentName}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> {item.recruiterName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {item.course}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" /> {formatDate(item.dateOfShortlist)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
