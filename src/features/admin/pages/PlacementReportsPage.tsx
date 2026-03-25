import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Briefcase, Save, Phone, CalendarDays, Building2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { PLACEMENT_STATUSES } from '@/constants/courses';
import { formatDate } from '@/utils/format';
import type { PlacementRow } from '@/types/admin.types';

const STATUS_OPTIONS = PLACEMENT_STATUSES.map((s) => ({ ...s }));

/* ─── Contacted table columns (read-only) ─── */
const contactedColumns: ColumnDef<PlacementRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ getValue }) => getValue<string>() ?? '-',
  },
  { accessorKey: 'course', header: 'Course' },
  {
    accessorKey: 'courseEndDate',
    header: 'Course End Date',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? formatDate(v) : '-';
    },
  },
  {
    accessorKey: 'placementStatus',
    header: 'Placement Status',
    cell: ({ getValue }) => {
      const s = getValue<string>();
      return (
        <Badge variant={s === 'PLACED' ? 'default' : 'secondary'}>
          {s === 'PLACED' ? 'Placed' : 'Not Placed'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'companyName',
    header: 'Placed in Company',
    cell: ({ getValue }) => getValue<string>() ?? '-',
  },
  {
    accessorKey: 'contactedDate',
    header: 'Contacted Date',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? formatDate(v) : '-';
    },
  },
];

/* ─── Editable row state for Not Contacted tab ─── */
interface EditState {
  [enrollmentId: string]: {
    placementStatus: string;
    companyName: string;
  };
}

export default function PlacementReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', course: '', status: '' });
  const [editState, setEditState] = useState<EditState>({});

  const queryKey = ['admin', 'reports', 'placement', filters];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      adminService.getPlacementReport({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        course: filters.course || undefined,
        status: filters.status || undefined,
      }),
  });

  const notContacted = data?.notContacted ?? [];
  const contacted = data?.contacted ?? [];
  const courses = data?.courses ?? [];

  /* ─── Filtered contacted list (client-side course/status filter) ─── */
  const filteredContacted = useMemo(() => {
    let list = contacted;
    if (filters.course) list = list.filter((r) => r.course === filters.course);
    if (filters.status) list = list.filter((r) => r.placementStatus === filters.status);
    return list;
  }, [contacted, filters.course, filters.status]);

  /* ─── Save mutation ─── */
  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { placementStatus: string; companyName?: string } }) =>
      adminService.updatePlacementContact(id, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey });
      setEditState((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.success('Placement contact saved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  /* ─── Edit helpers ─── */
  const getEdit = (row: PlacementRow) =>
    editState[row.id] ?? { placementStatus: row.placementStatus ?? '', companyName: row.companyName ?? '' };

  const setField = (id: string, field: 'placementStatus' | 'companyName', value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = (row: PlacementRow) => {
    const edit = getEdit(row);
    if (!edit.placementStatus) {
      toast.error('Please select a placement status');
      return;
    }
    saveMutation.mutate({
      id: row.id,
      data: { placementStatus: edit.placementStatus, companyName: edit.companyName || undefined },
    });
  };

  /* ─── CSV Download (Contacted tab) ─── */
  const downloadCsv = () => {
    if (filteredContacted.length === 0) return;
    const headers = ['Name', 'Phone', 'Course', 'Course End Date', 'Placement Status', 'Placed in Company', 'Contacted Date'];
    const rows = filteredContacted.map((r) => [
      r.name,
      r.phone ?? '',
      r.course,
      r.courseEndDate ? formatDate(r.courseEndDate) : '',
      r.placementStatus === 'PLACED' ? 'Placed' : 'Not Placed',
      r.companyName ?? '',
      r.contactedDate ? formatDate(r.contactedDate) : '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placement-contacted-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Placement Report</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage student placement follow-ups after course completion.
          </p>
        </div>

        {/* Enrollment Date Filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-md border bg-white p-4">
          <div className="space-y-1">
            <Label className="text-xs">Enrollment From Date</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={filters.fromDate}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Enrollment To Date</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={filters.toDate}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Tabs: Not Contacted / Contacted */}
        <Tabs defaultValue="not-contacted" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="not-contacted">
              Not Contacted {!isLoading && `(${notContacted.length})`}
            </TabsTrigger>
            <TabsTrigger value="contacted">
              Contacted {!isLoading && `(${contacted.length})`}
            </TabsTrigger>
          </TabsList>

          {/* ─── NOT CONTACTED TAB ─── */}
          <TabsContent value="not-contacted" className="mt-4">
            {isLoading ? (
              <TableSkeleton rows={6} columns={7} />
            ) : notContacted.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No students pending contact</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-left font-medium">Name</th>
                              <th className="px-4 py-3 text-left font-medium">Phone</th>
                              <th className="px-4 py-3 text-left font-medium">Course</th>
                              <th className="px-4 py-3 text-left font-medium">Course End Date</th>
                              <th className="px-4 py-3 text-left font-medium">Placement Status</th>
                              <th className="px-4 py-3 text-left font-medium">Placed in Company</th>
                              <th className="px-4 py-3 text-left font-medium">Contacted Date</th>
                              <th className="px-4 py-3 text-left font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notContacted.map((row) => {
                              const edit = getEdit(row);
                              return (
                                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                                  <td className="px-4 py-2 font-medium">{row.name}</td>
                                  <td className="px-4 py-2 text-muted-foreground">{row.phone ?? '-'}</td>
                                  <td className="px-4 py-2">{row.course}</td>
                                  <td className="px-4 py-2">
                                    {row.courseEndDate ? formatDate(row.courseEndDate) : '-'}
                                  </td>
                                  <td className="px-4 py-2">
                                    <Select
                                      value={edit.placementStatus || 'NOT_PLACED'}
                                      onValueChange={(v) => setField(row.id, 'placementStatus', v)}
                                    >
                                      <SelectTrigger className="w-32 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((o) => (
                                          <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Input
                                      className="h-8 w-40 text-xs"
                                      placeholder="Company name"
                                      value={edit.companyName}
                                      onChange={(e) => setField(row.id, 'companyName', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="text-muted-foreground/50 text-xs italic">Auto-set on save</span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 gap-1"
                                      disabled={saveMutation.isPending}
                                      onClick={() => handleSave(row)}
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                      Save
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile cards */}
                <div className="space-y-2 md:hidden">
                  {notContacted.map((row) => {
                    const edit = getEdit(row);
                    return (
                      <Card key={row.id}>
                        <CardContent className="p-3 space-y-3">
                          <div>
                            <p className="text-sm font-semibold">{row.name}</p>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              {row.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {row.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {row.course}
                              </span>
                              {row.courseEndDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" /> {formatDate(row.courseEndDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={edit.placementStatus || 'NOT_PLACED'}
                              onValueChange={(v) => setField(row.id, 'placementStatus', v)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className="h-8 text-xs"
                              placeholder="Company name"
                              value={edit.companyName}
                              onChange={(e) => setField(row.id, 'companyName', e.target.value)}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full h-8 gap-1"
                            disabled={saveMutation.isPending}
                            onClick={() => handleSave(row)}
                          >
                            <Save className="h-3.5 w-3.5" /> Save
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── CONTACTED TAB ─── */}
          <TabsContent value="contacted" className="mt-4 space-y-3">
            {/* Filters + Download */}
            <div className="flex flex-wrap items-end gap-3 rounded-md border bg-white p-3">
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select
                  value={filters.course || 'ALL'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, course: v === 'ALL' ? '' : v }))}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={filters.status || 'ALL'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'ALL' ? '' : v }))}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={filteredContacted.length === 0}>
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            </div>

            {isLoading ? (
              <TableSkeleton rows={6} columns={7} />
            ) : filteredContacted.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No contacted students found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Card>
                    <CardContent className="p-0">
                      <DataTable columns={contactedColumns} data={filteredContacted} emptyMessage="No contacted students found" />
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile cards */}
                <div className="space-y-2 md:hidden">
                  {filteredContacted.map((row) => (
                    <Card key={row.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{row.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              {row.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {row.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {row.course}
                              </span>
                              {row.courseEndDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" /> {formatDate(row.courseEndDate)}
                                </span>
                              )}
                              {row.companyName && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> {row.companyName}
                                </span>
                              )}
                              {row.contactedDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" /> Contacted: {formatDate(row.contactedDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={row.placementStatus === 'PLACED' ? 'default' : 'secondary'}
                            className="shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {row.placementStatus === 'PLACED' ? 'Placed' : 'Not Placed'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
