import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterService } from '@/services/recruiter.service';
import { formatDate } from '@/utils/format';

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date Shortlisted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.course}</TableCell>
                      <TableCell>{formatDate(record.dateOfShortlist)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
