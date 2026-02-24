import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Star, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterService } from '@/services/recruiter.service';
import { getErrorMessage } from '@/services/api';
import { COURSES, RECRUITER_DOWNLOAD_LIMIT } from '@/constants/courses';
import { formatExperience } from '@/utils/format';
import type { RecruiterCandidate } from '@/types/student.types';

const NUM_FILTERS = [
  { key: 'minExp' as const, label: 'Min IT Exp (yrs)', className: 'w-24' },
  { key: 'minTech' as const, label: 'Min Tech', className: 'w-20', min: '1', max: '10' },
  { key: 'minComm' as const, label: 'Min Comm', className: 'w-20', min: '1', max: '10' },
];

const INITIAL_FILTERS = { course: '', city: '', minExp: '', minTech: '', minComm: '' };

export default function CandidateFilterPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const setFilter = (key: keyof typeof INITIAL_FILTERS, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruiter', 'candidates', filters],
    queryFn: () =>
      recruiterService.getCandidates({
        course: filters.course || undefined,
        city: filters.city || undefined,
        minExperience: filters.minExp ? Number(filters.minExp) : undefined,
        minTechnicalRating: filters.minTech ? Number(filters.minTech) : undefined,
        minCommunicationRating: filters.minComm ? Number(filters.minComm) : undefined,
      }),
  });

  const { data: downloadCount } = useQuery({
    queryKey: ['recruiter', 'download-count'],
    queryFn: recruiterService.getDownloadCount,
  });

  const shortlistMutation = useMutation({
    mutationFn: recruiterService.shortlistCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'candidates'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'shortlist'] });
      toast.success('Candidate shortlisted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const isLimitReached = (downloadCount?.used ?? 0) >= RECRUITER_DOWNLOAD_LIMIT;

  const handleDownload = async (studentId: string) => {
    if (isLimitReached) { toast.error('Download limit reached'); return; }
    try {
      const blob = await recruiterService.downloadCv(studentId);
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'CV.pdf' }).click();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'download-count'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns: ColumnDef<RecruiterCandidate>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    { accessorKey: 'course', header: 'Course' },
    { accessorKey: 'city', header: 'City', cell: ({ getValue }) => getValue<string>() ?? '-' },
    {
      id: 'experience', header: 'Experience',
      accessorFn: (row) => row.itExperienceYears,
      cell: ({ row }) => formatExperience(row.original.itExperienceYears, row.original.itExperienceMonths),
    },
    {
      accessorKey: 'technicalScore',
      header: ({ column }) => <SortableHeader column={column} title="Tech" />,
      cell: ({ getValue }) => `${getValue<number>()}/10`,
    },
    {
      accessorKey: 'communicationScore',
      header: ({ column }) => <SortableHeader column={column} title="Comm" />,
      cell: ({ getValue }) => `${getValue<number>()}/10`,
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex gap-1">
            {c.cvUrl && (
              <Button variant="ghost" size="sm" onClick={() => handleDownload(c.id)} disabled={isLimitReached}
                title={isLimitReached ? 'Download limit reached' : 'Download CV'}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {!c.isShortlisted ? (
              <Button variant="ghost" size="sm" onClick={() => shortlistMutation.mutate(c.id)} loading={shortlistMutation.isPending}>
                {!shortlistMutation.isPending && <Star className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs">Shortlisted</Badge>
            )}
          </div>
        );
      },
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Candidate Search</h2>
          {isLimitReached ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> Download limit reached
            </Badge>
          ) : (
            <Badge variant="outline">Downloads: {downloadCount?.used ?? 0} / {RECRUITER_DOWNLOAD_LIMIT}</Badge>
          )}
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select value={filters.course} onValueChange={(v) => setFilter('course', v)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={filters.city} onChange={(e) => setFilter('city', e.target.value)} className="w-32" placeholder="City" />
              </div>
              {NUM_FILTERS.map(({ key, label, className, min, max }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" value={filters[key]} onChange={(e) => setFilter(key, e.target.value)} className={className} min={min} max={max} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                <Search className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={data?.items ?? []} emptyMessage="No candidates found" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
