import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListChecks, Briefcase, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { recruiterService } from '@/services/recruiter.service';
import { getErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/format';
import type { RecruiterShortlist } from '@/types/admin.types';

export default function ShortlistPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkRemove, setShowBulkRemove] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruiter', 'shortlist'],
    queryFn: recruiterService.getShortlist,
  });

  const removeMutation = useMutation({
    mutationFn: recruiterService.removeShortlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'shortlist'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'candidates'] });
      toast.success('Candidate removed from shortlist');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: recruiterService.bulkRemoveShortlist,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'shortlist'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'candidates'] });
      setSelectedIds(new Set());
      toast.success(`${result.removed} candidate(s) removed from shortlist`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.studentId));

  const toggleSelect = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.studentId)));
    }
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkRemoveMutation.mutate(ids);
    setShowBulkRemove(false);
  };

  const columns: ColumnDef<RecruiterShortlist>[] = [
    {
      id: 'select', enableSorting: false,
      header: () => (
        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.studentId)}
          onCheckedChange={() => toggleSelect(row.original.studentId)}
          aria-label={`Select ${row.original.studentName}`}
        />
      ),
    },
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
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <span className="font-medium text-foreground">{row.original.studentName}</span> from your shortlist.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => removeMutation.mutate(row.original.studentId)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-3">
        {/* Header + bulk actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold sm:text-xl">My Shortlist</h2>
            {items.length > 0 && (
              <Badge variant="outline">{data?.total ?? items.length} candidate{(data?.total ?? items.length) !== 1 ? 's' : ''}</Badge>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Cancel
              </Button>
              <AlertDialog open={showBulkRemove} onOpenChange={setShowBulkRemove}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
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
            </div>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No candidates shortlisted yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <DataTable columns={columns} data={items} emptyMessage="No candidates shortlisted yet" />
                </CardContent>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {/* Mobile select all */}
              <div className="flex items-center gap-2 px-1">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
              {items.map((item) => (
                <Card key={item.id} className={selectedIds.has(item.studentId) ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedIds.has(item.studentId)}
                        onCheckedChange={() => toggleSelect(item.studentId)}
                        className="mt-0.5"
                        aria-label={`Select ${item.studentName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.studentName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {item.course}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(item.dateOfShortlist)}
                          </span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove <span className="font-medium text-foreground">{item.studentName}</span> from your shortlist.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => removeMutation.mutate(item.studentId)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
