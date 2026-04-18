import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Briefcase,
  Save,
  Phone,
  CalendarDays,
  Building2,
  UserCheck,
  UserX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { PLACEMENT_STATUSES } from "@/constants/courses";
import { formatDate } from "@/utils/format";
import type { PlacementRow } from "@/types/admin.types";

const STATUS_OPTIONS = PLACEMENT_STATUSES.map((s) => ({ ...s }));

/* ─── Contacted table columns (read-only) ─── */
const contactedColumns: ColumnDef<PlacementRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>() ?? "-"}</span>
    ),
  },
  {
    accessorKey: "course",
    header: "Course",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="font-normal">
        {getValue<string>()}
      </Badge>
    ),
  },
  {
    accessorKey: "courseEndDate",
    header: "Course End Date",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return (
        <span className="text-muted-foreground">{v ? formatDate(v) : "-"}</span>
      );
    },
  },
  {
    accessorKey: "placementStatus",
    header: "Placement Status",
    cell: ({ getValue }) => {
      const s = getValue<string>();
      return (
        <Badge variant={s === "PLACED" ? "success" : "warning"}>
          {s === "PLACED" ? "Placed" : "Not Placed"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? (
        <span className="flex items-center gap-1.5 font-medium text-emerald-700">
          <Building2 className="h-3.5 w-3.5" /> {v}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "contactedDate",
    header: "Contacted Date",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return (
        <span className="text-muted-foreground">{v ? formatDate(v) : "-"}</span>
      );
    },
  },
];

/* ─── Editable row state ─── */
interface EditState {
  [enrollmentId: string]: {
    placementStatus: string;
    companyName: string;
  };
}

export default function PlacementReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    course: "",
    status: "",
  });
  const [editState, setEditState] = useState<EditState>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [contactConfirm, setContactConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const queryKey = ["admin", "reports", "placement", filters];

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
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

  /* ─── Summary stats ─── */
  const stats = useMemo(() => {
    const total = contacted.length + notContacted.length;
    const placedCount = contacted.filter(
      (r) => r.placementStatus === "PLACED",
    ).length;
    const rate = total > 0 ? Math.round((placedCount / total) * 100) : 0;
    return { placedCount, total, rate };
  }, [contacted, notContacted]);

  /* ─── Filtered contacted list ─── */
  const filteredContacted = useMemo(() => {
    let list = contacted;
    if (filters.course) list = list.filter((r) => r.course === filters.course);
    if (filters.status)
      list = list.filter((r) => r.placementStatus === filters.status);
    return list;
  }, [contacted, filters.course, filters.status]);

  /* ─── Quick mark as contacted mutation ─── */
  const contactMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      adminService.updatePlacementContact(id, {
        placementStatus: "NOT_PLACED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Student marked as contacted");
      setContactConfirm(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleContactConfirm = useCallback(() => {
    if (contactConfirm) {
      contactMutation.mutate({ id: contactConfirm.id });
    }
  }, [contactConfirm, contactMutation]);

  /* ─── Save mutation (with edit fields) ─── */
  const saveMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { placementStatus: string; companyName?: string };
    }) => adminService.updatePlacementContact(id, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey });
      setEditState((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      setExpandedRows((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
      toast.success("Placement contact saved");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  /* ─── Edit helpers ─── */
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getEdit = (row: PlacementRow) =>
    editState[row.id] ?? {
      placementStatus: row.placementStatus ?? "NOT_PLACED",
      companyName: row.companyName ?? "",
    };

  const setField = (
    id: string,
    field: "placementStatus" | "companyName",
    value: string,
  ) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { placementStatus: "NOT_PLACED", companyName: "" }),
        [field]: value,
      },
    }));
  };

  const handleSave = (row: PlacementRow) => {
    const edit = getEdit(row);
    if (!edit.placementStatus) {
      toast.error("Please select a placement status");
      return;
    }
    saveMutation.mutate({
      id: row.id,
      data: {
        placementStatus: edit.placementStatus,
        companyName: edit.companyName || undefined,
      },
    });
  };

  /* ─── CSV Download ─── */
  const downloadCsv = () => {
    if (filteredContacted.length === 0) return;
    const headers = [
      "Name",
      "Phone",
      "Course",
      "Course End Date",
      "Placement Status",
      "Company",
      "Contacted Date",
    ];
    const rows = filteredContacted.map((r) => [
      r.name,
      r.phone ?? "",
      r.course,
      r.courseEndDate ? formatDate(r.courseEndDate) : "",
      r.placementStatus === "PLACED" ? "Placed" : "Not Placed",
      r.companyName ?? "",
      r.contactedDate ? formatDate(r.contactedDate) : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement-contacted-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <>
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-md shadow-emerald-200/50">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Placement Report</h2>
              <p className="text-sm text-muted-foreground">
                Track and manage student placement follow-ups
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() =>
              setFilters({ fromDate: "", toDate: "", course: "", status: "" })
            }
            onRefresh={() => refetch()}
            isFetching={isFetching}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-emerald-200/60 bg-gradient-to-r from-emerald-100 to-teal-100 p-4">
          <div className="space-y-1">
            <Label className="text-xs">Enrollment From Date</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, fromDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Enrollment To Date</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={filters.toDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, toDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Course</Label>
            <Select
              value={filters.course || "ALL"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  course: v === "ALL" ? "" : v,
                }))
              }
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
              value={filters.status || "ALL"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  status: v === "ALL" ? "" : v,
                }))
              }
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
        </div>

        {/* Tabs */}
        <div>
          <Tabs defaultValue="not-contacted" className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList className="grid grid-cols-2 max-w-[440px]">
                  <TabsTrigger value="not-contacted" className="gap-1.5 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                    <UserX className="h-3.5 w-3.5" />
                    Not Contacted{" "}
                    {!isLoading && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-[10px] px-1.5 py-0"
                      >
                        {notContacted.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="contacted" className="gap-1.5 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                    <UserCheck className="h-3.5 w-3.5" />
                    Contacted{" "}
                    {!isLoading && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-[10px] px-1.5 py-0"
                      >
                        {contacted.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {!isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">
                        {stats.placedCount}/{stats.total} Placed
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 ml-1">
                        {stats.rate}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                      <UserCheck className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-muted-foreground">
                        Showing:
                      </span>
                      <span className="text-sm font-semibold">
                        {filteredContacted.length}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCsv}
                      disabled={filteredContacted.length === 0}
                    >
                      <Download className="h-4 w-4 mr-1" /> CSV
                    </Button>
                  </div>
                )}
              </div>

              {/* NOT CONTACTED TAB */}
              <TabsContent value="not-contacted" className="mt-4">
                {isLoading ? (
                  <TableSkeleton rows={6} columns={5} />
                ) : notContacted.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="rounded-full bg-emerald-50 p-4">
                        <UserCheck className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium">All caught up!</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          No students pending placement contact.
                        </p>
                      </div>
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
                                <tr className="border-b bg-orange-50/60">
                                  <th className="px-4 py-3 text-left font-medium text-orange-900/70">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-orange-900/70">
                                    Phone
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-orange-900/70">
                                    Course
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-orange-900/70">
                                    Course End Date
                                  </th>
                                  <th className="px-4 py-3 text-right font-medium text-orange-900/70">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {notContacted.map((row) => {
                                  const isExpanded = expandedRows.has(row.id);
                                  const edit = getEdit(row);
                                  return (
                                    <>
                                      <tr
                                        key={row.id}
                                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                      >
                                        <td className="px-4 py-3 font-medium">
                                          {row.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                          {row.phone ? (
                                            <span className="flex items-center gap-1.5">
                                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                                              {row.phone}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge
                                            variant="outline"
                                            className="font-normal"
                                          >
                                            {row.course}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                          {row.courseEndDate ? (
                                            <span className="flex items-center gap-1.5">
                                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                              {formatDate(row.courseEndDate)}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center justify-end gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                              onClick={() =>
                                                toggleExpand(row.id)
                                              }
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                              Edit
                                              {isExpanded ? (
                                                <ChevronUp className="h-3 w-3" />
                                              ) : (
                                                <ChevronDown className="h-3 w-3" />
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                              disabled={
                                                contactMutation.isPending
                                              }
                                              onClick={() =>
                                                setContactConfirm({
                                                  id: row.id,
                                                  name: row.name,
                                                })
                                              }
                                            >
                                              <UserCheck className="h-3.5 w-3.5" />
                                              Contacted
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                      {isExpanded && (
                                        <tr
                                          key={`${row.id}-edit`}
                                          className="border-b last:border-0 bg-orange-50/30"
                                        >
                                          <td colSpan={5} className="px-4 py-3">
                                            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-3">
                                              <div className="space-y-1">
                                                <Label className="text-xs text-orange-800">
                                                  Placement Status
                                                </Label>
                                                <Select
                                                  value={edit.placementStatus}
                                                  onValueChange={(v) =>
                                                    setField(
                                                      row.id,
                                                      "placementStatus",
                                                      v,
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger className="w-[140px] h-8 text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {STATUS_OPTIONS.map((o) => (
                                                      <SelectItem
                                                        key={o.value}
                                                        value={o.value}
                                                      >
                                                        {o.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs text-orange-800">
                                                  Company Name
                                                </Label>
                                                <Input
                                                  className="h-8 w-48 text-xs"
                                                  placeholder="Enter company name"
                                                  value={edit.companyName}
                                                  onChange={(e) =>
                                                    setField(
                                                      row.id,
                                                      "companyName",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>
                                              <Button
                                                size="sm"
                                                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                                disabled={
                                                  saveMutation.isPending
                                                }
                                                onClick={() => handleSave(row)}
                                              >
                                                <Save className="h-3.5 w-3.5" />
                                                Save & Contact
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </>
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
                        const isExpanded = expandedRows.has(row.id);
                        const edit = getEdit(row);
                        return (
                          <Card
                            key={row.id}
                            className="border-l-4 border-l-orange-400 overflow-hidden"
                          >
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold">
                                    {row.name}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    {row.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />{" "}
                                        {row.phone}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />{" "}
                                      {row.course}
                                    </span>
                                    {row.courseEndDate && (
                                      <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />{" "}
                                        {formatDate(row.courseEndDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 flex-1"
                                  onClick={() => toggleExpand(row.id)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700"
                                  disabled={contactMutation.isPending}
                                  onClick={() =>
                                    contactMutation.mutate({ id: row.id })
                                  }
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Contacted
                                </Button>
                              </div>

                              {isExpanded && (
                                <div className="space-y-2 rounded-lg border border-dashed border-orange-200 bg-orange-100 p-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-orange-800">
                                      Placement Status
                                    </Label>
                                    <Select
                                      value={edit.placementStatus}
                                      onValueChange={(v) =>
                                        setField(row.id, "placementStatus", v)
                                      }
                                    >
                                      <SelectTrigger className="w-full h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((o) => (
                                          <SelectItem
                                            key={o.value}
                                            value={o.value}
                                          >
                                            {o.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-orange-800">
                                      Company Name
                                    </Label>
                                    <Input
                                      className="h-8 text-xs"
                                      placeholder="Company name"
                                      value={edit.companyName}
                                      onChange={(e) =>
                                        setField(
                                          row.id,
                                          "companyName",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                    disabled={saveMutation.isPending}
                                    onClick={() => handleSave(row)}
                                  >
                                    <Save className="h-3.5 w-3.5" /> Save &
                                    Contact
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* CONTACTED TAB */}
              <TabsContent value="contacted" className="mt-4 space-y-3">
                {isLoading ? (
                  <TableSkeleton rows={6} columns={7} />
                ) : filteredContacted.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="rounded-full bg-blue-50 p-4">
                        <Phone className="h-8 w-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          No contacted students found
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Try adjusting filters or contact students from the
                          &quot;Not Contacted&quot; tab.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block">
                      <Card>
                        <CardContent className="p-0">
                          <DataTable
                            columns={contactedColumns}
                            data={filteredContacted}
                            emptyMessage="No contacted students found"
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-2 md:hidden">
                      {filteredContacted.map((row) => (
                        <Card
                          key={row.id}
                          className={
                            row.placementStatus === "PLACED"
                              ? "border-l-4 border-l-emerald-500"
                              : "border-l-4 border-l-orange-400"
                          }
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {row.name}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {row.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> {row.phone}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />{" "}
                                    {row.course}
                                  </span>
                                  {row.courseEndDate && (
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />{" "}
                                      {formatDate(row.courseEndDate)}
                                    </span>
                                  )}
                                  {row.companyName && (
                                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                      <Building2 className="h-3 w-3" />{" "}
                                      {row.companyName}
                                    </span>
                                  )}
                                  {row.contactedDate && (
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />{" "}
                                      Contacted: {formatDate(row.contactedDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  row.placementStatus === "PLACED"
                                    ? "success"
                                    : "warning"
                                }
                                className="shrink-0 text-[10px] px-1.5 py-0"
                              >
                                {row.placementStatus === "PLACED"
                                  ? "Placed"
                                  : "Not Placed"}
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
      </div>
    </PageTransition>

      {/* Confirmation dialog for marking as contacted */}
      <AlertDialog
        open={!!contactConfirm}
        onOpenChange={(open) => !open && setContactConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Contacted?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move{" "}
              <span className="font-semibold text-foreground">
                {contactConfirm?.name}
              </span>{" "}
              to the Contacted list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={contactMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContactConfirm}
              disabled={contactMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {contactMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
