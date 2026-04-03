import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Download,
  Search,
  X,
  Info,
  BookOpen,
  CreditCard,
  GraduationCap,
  Briefcase,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ENROLLMENT_STATUSES, INSTITUTES } from "@/constants/courses";
import type { EnrollmentStatus, Institute } from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

import { AddCandidateDialog } from "../components/AddCandidateDialog";
import { EditEnrollmentDialog } from "../components/EditEnrollmentDialog";
import { EnrollmentTableRow } from "../components/EnrollmentTableRow";
import { ProfileDialog } from "../components/ProfileDialog";
import { EvaluationDialog } from "../components/EvaluationDialog";

// ---------------------------------------------------------------------------
// Column group definitions
// ---------------------------------------------------------------------------

const COLUMN_GROUPS = [
  {
    label: "Actions",
    icon: Settings,
    colSpan: 2,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
  {
    label: "Basic Info",
    icon: Info,
    colSpan: 7,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Course Details",
    icon: BookOpen,
    colSpan: 6,
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    label: "Payment Tracking",
    icon: CreditCard,
    colSpan: 17,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    label: "Certificate",
    icon: GraduationCap,
    colSpan: 2,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    label: "Placement",
    icon: Briefcase,
    colSpan: 2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
] as const;

// Total columns: 1 (S.No) + 2 + 7 + 6 + 17 + 2 + 2 = 37

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  // State
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterInstitute, setFilterInstitute] = useState<string>("ALL");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<Enrollment | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [evaluationStudentId, setEvaluationStudentId] = useState<string | null>(
    null,
  );

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

  // Queries
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: [
      "admin",
      "enrollments",
      filterStatus,
      filterInstitute,
      filterCourse,
      currentPage,
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
        page: currentPage,
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Enrollment> }) => {
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

  const totalItems = data?.total ?? data?.items?.length ?? 0;
  const totalPages = data?.totalPages ?? 1;

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
                Monitoring {totalItems.toLocaleString()} active student records
                and financial health.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions
              onReset={() => {
                setFilterStatus("ALL");
                setFilterInstitute("ALL");
                setFilterCourse("");
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
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <>
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Active Filters:
                </span>
                {activeFilters.map((f) => (
                  <Badge
                    key={f.label}
                    variant="default"
                    className="gap-1 pl-2.5 pr-1 py-1"
                  >
                    {f.label}
                    <button
                      onClick={f.onRemove}
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </>
            )}
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
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {ENROLLMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Institute Filter */}
            <Select value={filterInstitute} onValueChange={setFilterInstitute}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Institute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Institutes</SelectItem>
                {INSTITUTES.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Course Filter */}
            <Select
              value={filterCourse || "ALL"}
              onValueChange={(v) => setFilterCourse(v === "ALL" ? "" : v)}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Export */}
            <Button variant="outline" size="sm">
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
          <Card className="overflow-hidden border-blue-200/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[2800px]">
                  <TableHeader>
                    {/* Row 1: Group headers */}
                    <TableRow className="border-b-0">
                      {/* S.No (spans 2 header rows) */}
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

                    {/* Row 2: Individual column headers */}
                    <TableRow>
                      {/* Actions sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-gray-50/50 text-center">
                        Edit
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-gray-50/50 text-center">
                        Delete
                      </TableHead>

                      {/* Basic Info sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-blue-50/50">
                        Full Name
                      </TableHead>
                      <TableHead className="text-xs bg-blue-50/50">
                        Email
                      </TableHead>
                      <TableHead className="text-xs bg-blue-50/50">
                        Phone
                      </TableHead>
                      <TableHead className="text-xs bg-blue-50/50">
                        Status
                      </TableHead>
                      <TableHead className="text-xs bg-blue-50/50">
                        Institute
                      </TableHead>
                      <TableHead className="text-xs bg-blue-50/50 text-center">
                        Profile
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-blue-50/50 text-center">
                        Evaluation
                      </TableHead>

                      {/* Course Details sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-orange-50/50">
                        Course Name
                      </TableHead>
                      <TableHead className="text-xs bg-orange-50/50">
                        Batch Name
                      </TableHead>
                      <TableHead className="text-xs bg-orange-50/50">
                        Trainer
                      </TableHead>
                      <TableHead className="text-xs bg-orange-50/50">
                        Start Date
                      </TableHead>
                      <TableHead className="text-xs bg-orange-50/50">
                        End Date
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-orange-50/50">
                        Completion
                      </TableHead>

                      {/* Payment Tracking sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-indigo-50/50">
                        Total Fee
                      </TableHead>
                      {/* 1st Installment */}
                      <TableHead className="text-xs bg-indigo-50/30">
                        1st Amt
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        1st Date
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        1st Mode
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        View
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        Send
                      </TableHead>
                      {/* 2nd Installment */}
                      <TableHead className="text-xs bg-indigo-50/50">
                        2nd Amt
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/50">
                        2nd Date
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/50">
                        2nd Mode
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/50">
                        View
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/50">
                        Send
                      </TableHead>
                      {/* 3rd Installment */}
                      <TableHead className="text-xs bg-indigo-50/30">
                        3rd Amt
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        3rd Date
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        3rd Mode
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        View
                      </TableHead>
                      <TableHead className="text-xs bg-indigo-50/30">
                        Send
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-indigo-50/50 text-destructive font-semibold">
                        Pending
                      </TableHead>

                      {/* Certificate sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-teal-50/50">
                        View
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-teal-50/50">
                        Send
                      </TableHead>

                      {/* Placement sub-headers */}
                      <TableHead className="text-xs border-l border-border bg-purple-50/50">
                        Status
                      </TableHead>
                      <TableHead className="text-xs border-r border-border bg-purple-50/50">
                        Company
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data?.items && data.items.length > 0 ? (
                      data.items.map((enrollment, index) => (
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
        )}

        {/* ================================================================ */}
        {/* Pagination */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * 10 + 1}-
              {Math.min(currentPage * 10, totalItems)}
            </span>{" "}
            of{" "}
            <span className="font-medium">{totalItems.toLocaleString()}</span>{" "}
            candidates
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                &lt;
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                &gt;
              </Button>
            </div>
          )}
        </div>

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
