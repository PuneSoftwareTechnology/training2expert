import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { FEE_DUE_FILTERS } from '@/constants/courses';
import { cn } from '@/lib/utils';

export default function FeeDuesPage() {
  const [daysFilter, setDaysFilter] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'fee-dues', daysFilter],
    queryFn: () => adminService.getFeeDuesReport(daysFilter),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.course}</TableCell>
                      <TableCell>
                        <Badge variant={row.completionStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                          {row.completionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalFee)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(row.paidAmount)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.pendingAmount)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-semibold',
                          row.daysSinceLastPayment > 90 ? 'text-destructive' :
                          row.daysSinceLastPayment > 60 ? 'text-orange-600' : 'text-yellow-600',
                        )}>
                          {row.daysSinceLastPayment}
                        </span>
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No fee dues found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
