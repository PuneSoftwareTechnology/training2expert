import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { INSTITUTES, MONTHS } from '@/constants/courses';

export default function EnrollmentFiguresPage() {
  const currentYear = new Date().getFullYear();
  const [institute, setInstitute] = useState<string>('PST');
  const [year, setYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'enrollment-figures', institute, year],
    queryFn: () => adminService.getEnrollmentFigures(institute, year),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <PageTransition>
      <div className="space-y-6">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Course</TableHead>
                    {MONTHS.map((m) => (
                      <TableHead key={m} className="text-center">{m}</TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((row) => (
                    <TableRow key={row.course}>
                      <TableCell className="sticky left-0 bg-card font-medium">{row.course}</TableCell>
                      {MONTHS.map((m) => (
                        <TableCell key={m} className="text-center">
                          {row.monthlyData[m] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold">{row.total}</TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                        No data available
                      </TableCell>
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
