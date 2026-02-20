import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

export default function RecruiterShortlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'recruiter-shortlist'],
    queryFn: adminService.getRecruiterShortlist,
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Recruiter Shortlist</h2>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No shortlist records</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.recruiterName}</TableCell>
                      <TableCell>{record.course}</TableCell>
                      <TableCell>{record.studentName}</TableCell>
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
