import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Star, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterService } from '@/services/recruiter.service';
import { getErrorMessage } from '@/services/api';
import { COURSES, RECRUITER_DOWNLOAD_LIMIT } from '@/constants/courses';
import { formatExperience } from '@/utils/format';

export default function CandidateFilterPage() {
  const queryClient = useQueryClient();
  const [course, setCourse] = useState('');
  const [city, setCity] = useState('');
  const [minExp, setMinExp] = useState('');
  const [minTech, setMinTech] = useState('');
  const [minComm, setMinComm] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruiter', 'candidates', { course, city, minExp, minTech, minComm }],
    queryFn: () =>
      recruiterService.getCandidates({
        course: course || undefined,
        city: city || undefined,
        minExperience: minExp ? Number(minExp) : undefined,
        minTechnicalRating: minTech ? Number(minTech) : undefined,
        minCommunicationRating: minComm ? Number(minComm) : undefined,
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
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const isDownloadLimitReached = (downloadCount?.used ?? 0) >= RECRUITER_DOWNLOAD_LIMIT;

  const handleDownload = async (studentId: string) => {
    if (isDownloadLimitReached) {
      toast.error('Download limit reached');
      return;
    }
    try {
      const blob = await recruiterService.downloadCv(studentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CV.pdf';
      link.click();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'download-count'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Candidate Search</h2>
          <div className="flex items-center gap-2">
            {isDownloadLimitReached ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Download limit reached
              </Badge>
            ) : (
              <Badge variant="outline">
                Downloads: {downloadCount?.used ?? 0} / {RECRUITER_DOWNLOAD_LIMIT}
              </Badge>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="w-32" placeholder="City" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min IT Exp (yrs)</Label>
                <Input type="number" value={minExp} onChange={(e) => setMinExp(e.target.value)} className="w-24" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Tech</Label>
                <Input type="number" value={minTech} onChange={(e) => setMinTech(e.target.value)} className="w-20" min="1" max="10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Comm</Label>
                <Input type="number" value={minComm} onChange={(e) => setMinComm(e.target.value)} className="w-20" min="1" max="10" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCourse(''); setCity(''); setMinExp(''); setMinTech(''); setMinComm(''); }}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Comm</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{candidate.course}</TableCell>
                      <TableCell>{candidate.city ?? '-'}</TableCell>
                      <TableCell>{formatExperience(candidate.itExperienceYears, candidate.itExperienceMonths)}</TableCell>
                      <TableCell>{candidate.technicalScore}/10</TableCell>
                      <TableCell>{candidate.communicationScore}/10</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {candidate.cvUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(candidate.id)}
                              disabled={isDownloadLimitReached}
                              title={isDownloadLimitReached ? 'Download limit reached' : 'Download CV'}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!candidate.isShortlisted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => shortlistMutation.mutate(candidate.id)}
                              loading={shortlistMutation.isPending}
                            >
                              {!shortlistMutation.isPending && <Star className="h-3.5 w-3.5" />}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">Shortlisted</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No candidates found</TableCell>
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
