import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Search, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/format";
import { ENROLLMENT_STATUSES, INSTITUTES } from "@/constants/courses";
import { COLUMN_GROUPS, SUB_COLUMNS } from "@/constants/enrollment-table";
import type { EnrollmentStatus, Institute } from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

function exportEnrollmentsCsv(items: Enrollment[]) {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Enrollment Status",
    "Institute",
    "Course",
    "Batch",
    "Trainer",
    "Start Date",
    "End Date",
    "Completion Status",
    "Total Fee",
    "Installment 1 Amount",
    "Installment 1 Date",
    "Installment 1 Mode",
    "Installment 2 Amount",
    "Installment 2 Date",
    "Installment 2 Mode",
    "Installment 3 Amount",
    "Installment 3 Date",
    "Installment 3 Mode",
    "Pending Amount",
    "Placement Status",
    "Company Name",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const fmtDate = (v?: string | null) => (v ? formatDate(v) : "");

  const rows = items.map((e) => {
    const paid =
      (Number(e.installment1_amount) || 0) +
      (Number(e.installment2_amount) || 0) +
      (Number(e.installment3_amount) || 0);
    const pending = (Number(e.total_fee) || 0) - paid;
    return [
      e.name,
      e.email,
      e.phone,
      e.enrollment_status,
      e.institute,
      e.course,
      e.batch,
      e.trainer,
      fmtDate(e.start_date),
      fmtDate(e.end_date),
      e.completion_status,
      e.total_fee,
      e.installment1_amount ?? "",
      fmtDate(e.installment1_date),
      e.installment1_mode ?? "",
      e.installment2_amount ?? "",
      fmtDate(e.installment2_date),
      e.installment2_mode ?? "",
      e.installment3_amount ?? "",
      fmtDate(e.installment3_date),
      e.installment3_mode ?? "",
      pending,
      e.placement_status,
      e.company_name ?? "",
    ]
      .map(escape)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enrollments_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

import { AddCandidateDialog } from "../components/AddCandidateDialog";
import { EditEnrollmentDialog } from "../components/EditEnrollmentDialog";
import { EnrollmentTableRow } from "../components/EnrollmentTableRow";
import { ProfileDialog } from "../components/ProfileDialog";
import { EvaluationDialog } from "../components/EvaluationDialog";


interface FilterConfig {
  key: string;
  placeholder: string;
  allLabel: string;
  width: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  // State
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterInstitute, setFilterInstitute] = useState<string>("ALL");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<Enrollment | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [evaluationStudentId, setEvaluationStudentId] = useState<string | null>(
    null,
  );
  const [filterCompletion, setFilterCompletion] = useState<string>("ALL");
  const [filterTrainer, setFilterTrainer] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");

  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragScrollLeft = useRef(0);
  const dragAxis = useRef<"none" | "horizontal">("none");

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't hijack clicks on buttons, links, inputs, selects
    const tag = (e.target as HTMLElement).closest("button, a, input, select, [role='menuitem']");
    if (tag) return;

    const el = tableScrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragAxis.current = "none";
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragScrollLeft.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;

    // Lock axis after 5px of movement
    if (dragAxis.current === "none" && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dragAxis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "none";
      if (dragAxis.current === "none") {
        // Vertical intent — stop dragging, let page scroll naturally
        isDragging.current = false;
        return;
      }
      const el = tableScrollRef.current!;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }

    if (dragAxis.current !== "horizontal") return;
    e.preventDefault();
    const el = tableScrollRef.current!;
    el.scrollLeft = dragScrollLeft.current - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    dragAxis.current = "none";
    const el = tableScrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
  }, []);

  // Active filter tags
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (filterStatus !== "ALL") {
    activeFilters.push({
      label: `Status: ${ENROLLMENT_STATUSES.find((s) => s.value === filterStatus)?.label ?? filterStatus}`,
      onRemove: () => setFilterStatus("ALL"),
    });
  }
  if (filterInstitute !== "ALL") {
    activeFilters.push({
      label: `Institute: ${filterInstitute}`,
      onRemove: () => setFilterInstitute("ALL"),
    });
  }
  if (filterCourse) {
    activeFilters.push({
      label: `Course: ${filterCourse}`,
      onRemove: () => setFilterCourse(""),
    });
  }
  if (filterCompletion !== "ALL") {
    const completionLabel =
      filterCompletion === "ACTIVE"
        ? "Active"
        : filterCompletion === "DROPOUT"
          ? "Dropout"
          : filterCompletion === "COMPLETED"
            ? "Completed"
            : filterCompletion;
    activeFilters.push({
      label: `Completion: ${completionLabel}`,
      onRemove: () => setFilterCompletion("ALL"),
    });
  }
  if (filterTrainer !== "ALL") {
    activeFilters.push({
      label: `Trainer: ${filterTrainer}`,
      onRemove: () => setFilterTrainer("ALL"),
    });
  }
  if (filterYear !== "ALL") {
    activeFilters.push({
      label: `Year: ${filterYear}`,
      onRemove: () => setFilterYear("ALL"),
    });
  }

  // Queries
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: [
      "admin",
      "enrollments",
      filterStatus,
      filterInstitute,
      filterCourse,
    ],
    queryFn: () =>
      adminService.getEnrollments({
        enrollment_status:
          filterStatus === "ALL"
            ? undefined
            : (filterStatus as EnrollmentStatus),
        institute:
          filterInstitute === "ALL"
            ? undefined
            : (filterInstitute as Institute),
        course: filterCourse || undefined,
        limit: 10000,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Enrollment>) =>
      adminService.createEnrollment(payload),
    onSuccess: () => {
      toast.success("Candidate enrolled successfully");
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Enrollment>;
    }) => {
      const result = await adminService.updateEnrollment(id, data);

      // Sync is_approved on the user when enrollment_status changes
      const enrollment = editEnrollment;
      if (enrollment?.student_id && data.enrollment_status) {
        if (data.enrollment_status === "APPROVED") {
          await adminService.approveStudent(enrollment.student_id);
        } else {
          await adminService.unapproveStudent(enrollment.student_id);
        }
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Enrollment updated successfully");
      setEditEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const courses = data?.courses ?? [];

  const allItems = data?.items ?? [];
  const years = [
    ...new Set(
      allItems
        .map((e) =>
          e.start_date ? new Date(e.start_date).getFullYear().toString() : "",
        )
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();

  const { filteredItems, trainers } = (() => {
    let items = allItems;

    // Filter by completion status ("ACTIVE" includes both ACTIVE and IN_PROGRESS)
    if (filterCompletion !== "ALL") {
      if (filterCompletion === "ACTIVE") {
        items = items.filter(
          (e) =>
            e.completion_status === "ACTIVE" ||
            e.completion_status === "IN_PROGRESS",
        );
      } else {
        items = items.filter((e) => e.completion_status === filterCompletion);
      }
    }

    // Filter by year
    if (filterYear !== "ALL") {
      items = items.filter(
        (e) =>
          e.start_date &&
          new Date(e.start_date).getFullYear().toString() === filterYear,
      );
    }

    // Derive trainers AFTER completion/year filters so only relevant trainers appear
    const trainers = [
      ...new Set(items.map((e) => e.trainer).filter(Boolean)),
    ].sort();

    // Filter by trainer
    if (filterTrainer !== "ALL") {
      items = items.filter((e) => e.trainer === filterTrainer);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter((e) =>
        [
          e.name,
          e.email,
          e.phone,
          e.course,
          e.batch,
          e.trainer,
          e.institute,
          e.enrollment_status,
          e.completion_status,
          e.placement_status,
          e.company_name,
        ]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      );
    }

    return { filteredItems: items, trainers };
  })();

  // Build filter configs for data-driven rendering
  const filters: FilterConfig[] = [
    {
      key: "status",
      placeholder: "Status",
      allLabel: "All Status",
      width: "w-[130px]",
      value: filterStatus,
      onChange: setFilterStatus,
      options: ENROLLMENT_STATUSES.map((s) => ({
        value: s.value,
        label: s.label,
      })),
    },
    {
      key: "institute",
      placeholder: "Institute",
      allLabel: "All Institutes",
      width: "w-[130px]",
      value: filterInstitute,
      onChange: setFilterInstitute,
      options: INSTITUTES.map((inst) => ({ value: inst, label: inst })),
    },
    {
      key: "course",
      placeholder: "Course",
      allLabel: "All Courses",
      width: "w-[150px]",
      value: filterCourse || "ALL",
      onChange: (v) => setFilterCourse(v === "ALL" ? "" : v),
      options: courses.map((c) => ({ value: c, label: c })),
    },
    {
      key: "completion",
      placeholder: "Completion",
      allLabel: "All Students",
      width: "w-[150px]",
      value: filterCompletion,
      onChange: setFilterCompletion,
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "COMPLETED", label: "Completed" },
        { value: "DROPOUT", label: "Dropout" },
      ],
    },
    {
      key: "trainer",
      placeholder: "Trainer",
      allLabel: "All Trainers",
      width: "w-[150px]",
      value: filterTrainer,
      onChange: setFilterTrainer,
      options: trainers.map((t) => ({ value: t, label: t })),
    },
    {
      key: "year",
      placeholder: "Year",
      allLabel: "All Years",
      width: "w-[120px]",
      value: filterYear,
      onChange: setFilterYear,
      options: years.map((y) => ({ value: y, label: y })),
    },
  ];

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* ================================================================ */}
        {/* Page Header */}
        {/* ================================================================ */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-md shadow-blue-200/50">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Enrollment Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitoring student records and financial health.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions
              onReset={() => {
                setFilterStatus("ALL");
                setFilterInstitute("ALL");
                setFilterCourse("");
                setFilterCompletion("ALL");
                setFilterTrainer("ALL");
                setFilterYear("ALL");
                setSearchQuery("");
              }}
              onRefresh={() => refetch()}
              isFetching={isRefetching}
            />
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Enrollment
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Active Filters + Actions Bar */}
        {/* ================================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200/60 bg-gradient-to-r from-blue-100 to-indigo-100 p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold whitespace-nowrap">
              Total: {filteredItems.length} students
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across columns..."
                className="h-9 w-64 pl-9"
              />
            </div>
            {/* Filter Dropdowns */}
            {filters.map((f) => (
              <Select key={f.key} value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className={`h-9 ${f.width}`}>
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{f.allLabel}</SelectItem>
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              disabled={!filteredItems.length}
              onClick={() => {
                if (filteredItems.length) {
                  exportEnrollmentsCsv(filteredItems);
                  toast.success("CSV exported");
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Grouped Column Table */}
        {/* ================================================================ */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={12} />
        ) : (
          <>
            <Card className="overflow-hidden border-blue-200/60">
              <CardContent className="p-0">
                <div
                  ref={tableScrollRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  className="overflow-x-auto cursor-grab [&_[data-slot=table-container]]:overflow-visible"
                >
                  <Table className="min-w-[2800px]">
                    <TableHeader>
                      {/* Row 1: Group headers */}
                      <TableRow className="border-b-0">
                        <TableHead
                          rowSpan={2}
                          className="border-r border-border bg-muted/60 text-xs font-bold uppercase tracking-wider align-bottom w-[60px] text-center"
                        >
                          S.No
                        </TableHead>
                        {COLUMN_GROUPS.map((group) => (
                          <TableHead
                            key={group.label}
                            colSpan={group.colSpan}
                            className={`text-center border-x border-border text-xs font-bold uppercase tracking-wider ${group.color}`}
                          >
                            <div className="flex items-center justify-center gap-1.5 py-1">
                              <group.icon className="h-3.5 w-3.5" />
                              {group.label}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>

                      {/* Row 2: Sub-column headers */}
                      <TableRow>
                        {SUB_COLUMNS.map((col, i) => (
                          <TableHead
                            key={i}
                            className={`text-xs ${col.bg} ${col.extra ?? ""}`}
                          >
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredItems.length > 0 ? (
                        filteredItems.map((enrollment, index) => (
                          <EnrollmentTableRow
                            key={enrollment.id}
                            enrollment={enrollment}
                            index={index}
                            onEdit={setEditEnrollment}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onViewProfile={setProfileStudentId}
                            onViewEvaluation={setEvaluationStudentId}
                          />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={37}
                            className="py-12 text-center text-muted-foreground"
                          >
                            No enrollments found matching your criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ================================================================ */}
        {/* Dialogs */}
        {/* ================================================================ */}
        <AddCandidateDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isPending={createMutation.isPending}
        />

        <EditEnrollmentDialog
          enrollment={editEnrollment}
          open={!!editEnrollment}
          onOpenChange={(open) => {
            if (!open) setEditEnrollment(null);
          }}
          onSubmit={(id, data) => updateMutation.mutate({ id, data })}
          isPending={updateMutation.isPending}
        />

        <ProfileDialog
          studentId={profileStudentId || ""}
          open={!!profileStudentId}
          onOpenChange={(open) => {
            if (!open) setProfileStudentId(null);
          }}
        />

        <EvaluationDialog
          studentId={evaluationStudentId || ""}
          open={!!evaluationStudentId}
          onOpenChange={(open) => {
            if (!open) setEvaluationStudentId(null);
          }}
        />
      </div>
    </PageTransition>
  );
}
