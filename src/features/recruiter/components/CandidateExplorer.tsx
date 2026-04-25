import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download, Star, MapPin, Briefcase, Users, CheckSquare,
  ChevronLeft, ChevronRight, Mail, User, ExternalLink, Trash2, ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { FilterActions } from '@/components/ui/filter-actions';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterService } from '@/services/recruiter.service';
import { getErrorMessage } from '@/services/api';
import { RECRUITER_DOWNLOAD_LIMIT } from '@/constants/courses';
import { formatExperience } from '@/utils/format';
import { ProfileDialog } from './ProfileDialog';
import type { RecruiterCandidate } from '@/types/student.types';

const EXP_YEAR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20] as const;
const TECH_SCORE_OPTIONS = [30, 40, 50, 60, 70, 80, 90] as const;
const COMM_SCORE_OPTIONS = [3, 4, 5, 6, 7, 8, 9] as const;

const INITIAL_FILTERS = {
  course: '',
  city: '',
  area: '',
  minExperience: '',
  maxExperience: '',
  minTechnicalScore: '',
  minCommunicationScore: '',
};

interface Props {
  mode: 'candidates' | 'shortlist';
}

export function CandidateExplorer({ mode }: Props) {
  const isShortlistMode = mode === 'shortlist';
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [showBulkRemove, setShowBulkRemove] = useState(false);
  const [pendingShortlistId, setPendingShortlistId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const setFilter = (key: keyof typeof INITIAL_FILTERS, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setCurrentPage(1);
  };

  const queryKey = isShortlistMode
    ? ['recruiter', 'shortlisted-candidates', filters, currentPage]
    : ['recruiter', 'candidates', filters, currentPage];

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      recruiterService.getCandidates({
        course: filters.course || undefined,
        city: filters.city || undefined,
        area: filters.area || undefined,
        minExperience: filters.minExperience ? Number(filters.minExperience) : undefined,
        maxExperience: filters.maxExperience ? Number(filters.maxExperience) : undefined,
        minTechnicalScore: filters.minTechnicalScore ? Number(filters.minTechnicalScore) : undefined,
        minCommunicationScore: filters.minCommunicationScore ? Number(filters.minCommunicationScore) : undefined,
        shortlistedOnly: isShortlistMode,
        page: currentPage,
      }),
  });

  const { data: downloadCount } = useQuery({
    queryKey: ['recruiter', 'download-count'],
    queryFn: recruiterService.getDownloadCount,
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['recruiter', 'candidates'] });
    queryClient.invalidateQueries({ queryKey: ['recruiter', 'shortlisted-candidates'] });
    queryClient.invalidateQueries({ queryKey: ['recruiter', 'shortlist'] });
  };

  const shortlistMutation = useMutation({
    mutationFn: recruiterService.shortlistCandidate,
    onSuccess: () => { invalidateLists(); toast.success('Candidate shortlisted'); },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setPendingShortlistId(null),
  });

  const bulkShortlistMutation = useMutation({
    mutationFn: recruiterService.bulkShortlist,
    onSuccess: (result) => {
      invalidateLists();
      setSelectedIds(new Set());
      toast.success(`${result.shortlisted} candidate(s) shortlisted${result.skipped ? `, ${result.skipped} skipped` : ''}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: recruiterService.removeShortlist,
    onSuccess: () => { invalidateLists(); toast.success('Candidate removed from shortlist'); },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setPendingRemoveId(null),
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: recruiterService.bulkRemoveShortlist,
    onSuccess: (result) => {
      invalidateLists();
      setSelectedIds(new Set());
      toast.success(`${result.removed} candidate(s) removed from shortlist`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const [emailDialog, setEmailDialog] = useState(false);
  const [emailMode, setEmailMode] = useState<'single' | 'bulk'>('single');
  const [emailTargetId, setEmailTargetId] = useState('');
  const [emailTargetName, setEmailTargetName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const sendEmailMutation = useMutation({
    mutationFn: () => recruiterService.sendEmail(emailTargetId, emailSubject, emailBody),
    onSuccess: () => { toast.success('Email sent'); setEmailDialog(false); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bulkEmailMutation = useMutation({
    mutationFn: () => recruiterService.bulkSendEmail(Array.from(selectedIds), emailSubject, emailBody),
    onSuccess: (result) => {
      toast.success(`Email sent to ${result.sent} candidate${result.sent !== 1 ? 's' : ''}${result.failed ? `, ${result.failed} failed` : ''}`);
      setEmailDialog(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEmailDialog = (candidate: RecruiterCandidate) => {
    setEmailMode('single');
    setEmailTargetId(candidate.id);
    setEmailTargetName(candidate.name);
    setEmailSubject('');
    setEmailBody('');
    setEmailDialog(true);
  };

  const openBulkEmailDialog = () => {
    setEmailMode('bulk');
    setEmailSubject('');
    setEmailBody('');
    setEmailDialog(true);
  };

  const courses = data?.courses ?? [];
  const cities = data?.cities ?? [];
  const areas = data?.areas ?? [];
  const candidates = data?.items ?? [];

  // In candidates mode, only non-shortlisted rows are selectable.
  // In shortlist mode, every row is selectable (all are shortlisted by definition).
  const selectableCandidates = isShortlistMode
    ? candidates
    : candidates.filter((c) => !c.isShortlisted);
  const allSelected = selectableCandidates.length > 0 && selectableCandidates.every((c) => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableCandidates.map((c) => c.id)));
  };

  const handleBulkShortlist = () => {
    const items = candidates
      .filter((c) => selectedIds.has(c.id) && !c.isShortlisted)
      .map((c) => ({ studentId: c.id, course: c.course }));
    if (items.length === 0) return;
    bulkShortlistMutation.mutate(items);
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkRemoveMutation.mutate(ids);
    setShowBulkRemove(false);
  };

  const isLimitReached = (downloadCount?.used ?? 0) >= RECRUITER_DOWNLOAD_LIMIT;

  const handleDownload = async (studentId: string) => {
    if (isLimitReached) { toast.error('Download limit reached'); return; }
    try {
      const result = await recruiterService.downloadCv(studentId);
      window.open(result.signedUrl, '_blank');
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'download-count'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const pageSize = 20;
  const snoOffset = (currentPage - 1) * pageSize;

  const renderRowAction = (c: RecruiterCandidate) => {
    if (isShortlistMode) {
      const isPending = pendingRemoveId === c.id && removeMutation.isPending;
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" loading={isPending} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              {!isPending && <Trash2 className="mr-1 h-3.5 w-3.5" />} Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <span className="font-medium text-foreground">{c.name}</span> from your shortlist.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { setPendingRemoveId(c.id); removeMutation.mutate(c.id); }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    if (!c.isShortlisted) {
      const isPending = pendingShortlistId === c.id && shortlistMutation.isPending;
      return (
        <Button
          variant="default"
          size="sm"
          loading={isPending}
          onClick={() => { setPendingShortlistId(c.id); shortlistMutation.mutate({ studentId: c.id, course: c.course }); }}
        >
          {!isPending && <Star className="mr-1 h-3.5 w-3.5" />} Shortlist
        </Button>
      );
    }
    return <Badge variant="outline" className="text-xs text-green-600 border-green-600">Shortlisted</Badge>;
  };

  const columns: ColumnDef<RecruiterCandidate>[] = [
    {
      id: 'sno', header: 'S.No', enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{snoOffset + row.index + 1}</span>,
    },
    {
      id: 'select', enableSorting: false,
      header: () => (
        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
      ),
      cell: ({ row }) => {
        const c = row.original;
        if (!isShortlistMode && c.isShortlisted) return null;
        return (
          <Checkbox
            checked={selectedIds.has(c.id)}
            onCheckedChange={() => toggleSelect(c.id)}
            aria-label={`Select ${c.name}`}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    { accessorKey: 'course', header: 'Course' },
    { accessorKey: 'city', header: 'City', cell: ({ getValue }) => getValue<string>() ?? '-' },
    { accessorKey: 'area', header: 'Area', cell: ({ getValue }) => getValue<string>() ?? '-' },
    {
      id: 'experience', header: 'Experience',
      accessorFn: (row) => row.itExperienceYears,
      cell: ({ row }) => formatExperience(row.original.itExperienceYears, row.original.itExperienceMonths),
    },
    {
      id: 'technicalScore', header: 'Technical Score', enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        const pct = c.technicalTotalMarks > 0 ? Math.round((c.technicalMarksScored / c.technicalTotalMarks) * 100) : 0;
        const color = pct >= 70
          ? 'border-green-200 bg-green-50 text-green-700'
          : pct >= 40
            ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
            : 'border-red-200 bg-red-50 text-red-700';
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
            {c.technicalMarksScored}/{c.technicalTotalMarks}
            {c.technicalTotalMarks > 0 && ` (${pct}%)`}
          </span>
        );
      },
    },
    {
      id: 'communicationScore', header: 'Communication Score', enableSorting: false,
      cell: ({ row }) => {
        const score = Number(row.original.communicationScore);
        const color = score >= 7
          ? 'border-green-200 bg-green-50 text-green-700'
          : score >= 4
            ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
            : 'border-red-200 bg-red-50 text-red-700';
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
            {row.original.communicationScore}/10
          </span>
        );
      },
    },
    {
      id: 'project', header: 'Project', enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        if (!c.projectUrl) return <span className="text-muted-foreground">-</span>;
        return (
          <Button variant="outline" size="sm" asChild>
            <a href={c.projectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> View
            </a>
          </Button>
        );
      },
    },
    {
      id: 'profile', header: 'Profile', enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary"
          title="View Profile"
          onClick={() => setProfileStudentId(row.original.id)}
        >
          <User className="h-3.5 w-3.5" />
        </Button>
      ),
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex gap-2">
            {c.cvUrl && (
              <Button variant="outline" size="sm" onClick={() => handleDownload(c.id)} disabled={isLimitReached}
                title={isLimitReached ? 'Download limit reached' : 'Download CV'}>
                <Download className="mr-1 h-3.5 w-3.5" /> CV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => openEmailDialog(c)} title="Send Email">
              <Mail className="mr-1 h-3.5 w-3.5" /> Email
            </Button>
            {renderRowAction(c)}
          </div>
        );
      },
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  const filterCardClass = isShortlistMode
    ? 'border-emerald-100/70 bg-gradient-to-br from-emerald-50/40 to-teal-50/30'
    : 'border-indigo-100/70 bg-gradient-to-br from-indigo-50/40 to-sky-50/30';
  const tableHeaderClass = isShortlistMode
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
    : 'bg-gradient-to-r from-indigo-600 to-sky-600';
  const emptyIcon = isShortlistMode ? ListChecks : Users;
  const emptyMsg = isShortlistMode ? 'No shortlisted candidates match your filters' : 'No candidates found';

  return (
    <PageTransition>
      <div className="space-y-3">
        {/* Filters + Bulk Actions */}
        <Card className={filterCardClass}>
          <CardContent className="px-3 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Course</Label>
                  <Select value={filters.course || 'ALL'} onValueChange={(v) => setFilter('course', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">City</Label>
                  <Select value={filters.city || 'ALL'} onValueChange={(v) => setFilter('city', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Area</Label>
                  <Select value={filters.area || 'ALL'} onValueChange={(v) => setFilter('area', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Min IT Exp</Label>
                  <Select value={filters.minExperience || 'ALL'} onValueChange={(v) => setFilter('minExperience', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-28"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {EXP_YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y} yrs</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Max IT Exp</Label>
                  <Select value={filters.maxExperience || 'ALL'} onValueChange={(v) => setFilter('maxExperience', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-28"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {EXP_YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y} yrs</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Min Tech Score</Label>
                  <Select value={filters.minTechnicalScore || 'ALL'} onValueChange={(v) => setFilter('minTechnicalScore', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-28"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {TECH_SCORE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{s}%+</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Min Comm Score</Label>
                  <Select value={filters.minCommunicationScore || 'ALL'} onValueChange={(v) => setFilter('minCommunicationScore', v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-28"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {COMM_SCORE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{s}+/10</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    isShortlistMode
                      ? 'h-8 border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700'
                      : 'h-8 border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700'
                  }
                >
                  {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'candidate' : 'candidates'}
                </Badge>
                <FilterActions
                  onReset={() => setFilters(INITIAL_FILTERS)}
                  onRefresh={() => refetch()}
                  isFetching={isFetching}
                />
              </div>
            </div>

            {/* Bulk actions row */}
            {selectedIds.size > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedIds(new Set())}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={openBulkEmailDialog}
                >
                  <Mail className="mr-1 h-3.5 w-3.5" /> Email {selectedIds.size}
                </Button>
                {isShortlistMode ? (
                  <AlertDialog open={showBulkRemove} onOpenChange={setShowBulkRemove}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8">
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} from shortlist?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the selected candidates from your shortlist. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={handleBulkRemove}
                        >
                          Remove {selectedIds.size}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button size="sm" className="h-8" onClick={handleBulkShortlist} loading={bulkShortlistMutation.isPending}>
                    {!bulkShortlistMutation.isPending && <CheckSquare className="mr-1 h-3.5 w-3.5" />}
                    Shortlist
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <TableSkeleton rows={6} columns={12} />
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              {(() => { const Icon = emptyIcon; return <Icon className="h-10 w-10 text-muted-foreground" />; })()}
              <p className="text-muted-foreground">{emptyMsg}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <DataTable columns={columns} data={candidates} emptyMessage={emptyMsg} headerClassName={tableHeaderClass} />
                </CardContent>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {selectableCandidates.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                  <span className="text-xs text-muted-foreground">Select all</span>
                </div>
              )}
              {candidates.map((c, index) => (
                <Card key={c.id} className={selectedIds.has(c.id) ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {(isShortlistMode || !c.isShortlisted) && (
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                          className="mt-0.5"
                          aria-label={`Select ${c.name}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            <span className="text-muted-foreground mr-1">{snoOffset + index + 1}.</span>
                            {c.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-primary"
                              title="View Profile"
                              onClick={() => setProfileStudentId(c.id)}
                            >
                              <User className="h-3 w-3" />
                            </Button>
                            {!isShortlistMode && c.isShortlisted && (
                              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 text-green-600 border-green-600">Shortlisted</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {c.course}
                          </span>
                          {c.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {c.city}
                            </span>
                          )}
                          {c.area && <span>Area: {c.area}</span>}
                          <span>Exp: {formatExperience(c.itExperienceYears, c.itExperienceMonths)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${
                            c.technicalTotalMarks > 0 && Math.round((c.technicalMarksScored / c.technicalTotalMarks) * 100) >= 70
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : c.technicalTotalMarks > 0 && Math.round((c.technicalMarksScored / c.technicalTotalMarks) * 100) >= 40
                                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                          }`}>
                            Tech: {c.technicalMarksScored}/{c.technicalTotalMarks}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${
                            Number(c.communicationScore) >= 7
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : Number(c.communicationScore) >= 4
                                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                          }`}>
                            Comm: {c.communicationScore}/10
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.cvUrl && (
                            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => handleDownload(c.id)} disabled={isLimitReached}>
                              <Download className="mr-1 h-3 w-3" /> CV
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => openEmailDialog(c)}>
                            <Mail className="mr-1 h-3 w-3" /> Email
                          </Button>
                          {c.projectUrl && (
                            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" asChild>
                              <a href={c.projectUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3 w-3" /> Project
                              </a>
                            </Button>
                          )}
                          {isShortlistMode ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  loading={pendingRemoveId === c.id && removeMutation.isPending}
                                  className="h-7 flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  {!(pendingRemoveId === c.id && removeMutation.isPending) && <Trash2 className="mr-1 h-3 w-3" />} Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove <span className="font-medium text-foreground">{c.name}</span> from your shortlist.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => { setPendingRemoveId(c.id); removeMutation.mutate(c.id); }}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            !c.isShortlisted && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 flex-1 text-xs"
                                loading={pendingShortlistId === c.id && shortlistMutation.isPending}
                                onClick={() => { setPendingShortlistId(c.id); shortlistMutation.mutate({ studentId: c.id, course: c.course }); }}
                              >
                                {!(pendingShortlistId === c.id && shortlistMutation.isPending) && <Star className="mr-1 h-3 w-3" />} Shortlist
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {(data?.totalPages ?? 1) > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(data?.totalPages ?? 1, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon" className="h-8 w-8"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={currentPage === (data?.totalPages ?? 1)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Email Dialog (single or bulk) */}
        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {emailMode === 'bulk'
                  ? `Send Email to ${selectedIds.size} candidate${selectedIds.size !== 1 ? 's' : ''}`
                  : `Send Email to ${emailTargetName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter subject..." />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} placeholder="Enter email body..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
                <Button
                  onClick={() => emailMode === 'bulk' ? bulkEmailMutation.mutate() : sendEmailMutation.mutate()}
                  loading={emailMode === 'bulk' ? bulkEmailMutation.isPending : sendEmailMutation.isPending}
                  disabled={!emailSubject.trim() || !emailBody.trim()}
                >
                  {(emailMode === 'bulk' ? bulkEmailMutation.isPending : sendEmailMutation.isPending) ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <ProfileDialog
          studentId={profileStudentId || ''}
          open={!!profileStudentId}
          onOpenChange={(open) => { if (!open) setProfileStudentId(null); }}
        />
      </div>
    </PageTransition>
  );
}
