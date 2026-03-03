import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { INSTITUTES, ENROLLMENT_STATUSES } from "@/constants/courses";
import type { EnrollmentStatus, Institute } from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

// Extracted Components
import { AddCandidateDialog } from "../components/AddCandidateDialog";
import {
  EnrollmentTableRow,
  type EditableFields,
} from "../components/EnrollmentTableRow";
import { ProfileDialog } from "../components/ProfileDialog";

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterInstitute, setFilterInstitute] = useState<string>("ALL");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditableFields | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Queries & Mutations
  // ---------------------------------------------------------------------------

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
    mutationFn: ({ id, data }: { id: string; data: Partial<Enrollment> }) =>
      adminService.updateEnrollment(id, data),
    onSuccess: () => {
      toast.success("Enrollment updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveStudent(id),
    onSuccess: () => {
      toast.success("Enrollment approved");
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminService.rejectStudent(id),
    onSuccess: () => {
      toast.success("Enrollment rejected");
      queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const startEditing = useCallback((enrollment: Enrollment) => {
    setEditingId(enrollment.id);
    setEditFields({
      name: enrollment.name,
      email: enrollment.email,
      phone: enrollment.phone,
      enrollment_status: enrollment.enrollment_status,
      institute: enrollment.institute,
      course: enrollment.course,
      batch: enrollment.batch,
      trainer: enrollment.trainer,
      start_date: enrollment.start_date,
      end_date: enrollment.end_date,
      completion_status: enrollment.completion_status,
      total_fee: enrollment.total_fee,
      placement_status: enrollment.placement_status,
      company_name: enrollment.company_name,
    });
  }, []);

  const updateEditField = useCallback(
    <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => {
      setEditFields((prev) => (prev ? { ...prev, [key]: value } : null));
    },
    [],
  );

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditFields(null);
  }, []);

  const saveEditing = useCallback(
    (enrollment: Enrollment) => {
      if (!editFields) return;
      updateMutation.mutate({ id: enrollment.id, data: editFields });
    },
    [editFields, updateMutation],
  );

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enrollments</h1>
            <p className="text-sm text-muted-foreground">
              Manage student enrollments, statuses, and course details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Candidate
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Enrollment Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {ENROLLMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Institute</Label>
                <Select
                  value={filterInstitute}
                  onValueChange={setFilterInstitute}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {INSTITUTES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Input
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  placeholder="Filter by course"
                  className="w-40"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("ALL");
                  setFilterInstitute("ALL");
                  setFilterCourse("");
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={10} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Institute</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items && data.items.length > 0 ? (
                    data.items.map((enrollment) => (
                      <EnrollmentTableRow
                        key={enrollment.id}
                        enrollment={enrollment}
                        isEditing={editingId === enrollment.id}
                        isExpanded={expandedIds.has(enrollment.id)}
                        editFields={
                          editingId === enrollment.id ? editFields : null
                        }
                        onToggleExpand={() => toggleExpand(enrollment.id)}
                        onStartEdit={startEditing}
                        onCancelEdit={cancelEditing}
                        onSaveEdit={saveEditing}
                        onViewProfile={(sid) => setProfileStudentId(sid)}
                        onApprove={(e) => approveMutation.mutate(e.id)}
                        onReject={(e) => rejectMutation.mutate(e.id)}
                        onUpdateField={updateEditField}
                        isSaving={updateMutation.isPending}
                        isApproving={approveMutation.isPending}
                        isRejecting={rejectMutation.isPending}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={13}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No enrollments found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination placeholder */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === data.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <AddCandidateDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isPending={createMutation.isPending}
        />

        <ProfileDialog
          studentId={profileStudentId || ""}
          open={!!profileStudentId}
          onOpenChange={(open) => {
            if (!open) setProfileStudentId(null);
          }}
        />
      </div>
    </PageTransition>
  );
}
