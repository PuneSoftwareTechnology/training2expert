import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, ChevronDown, ChevronUp, User, Check, X, Send, Save,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  COURSES, INSTITUTES, ENROLLMENT_STATUSES, COMPLETION_STATUSES,
} from '@/constants/courses';
import type {
  Enrollment, EnrollmentStatus, CompletionStatus, PlacementStatus,
  Institute, Installment,
} from '@/types/student.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditableFields {
  name: string;
  email: string;
  phone: string;
  enrollmentStatus: EnrollmentStatus;
  institute: Institute;
  course: string;
  batch: string;
  trainer: string;
  startDate: string;
  endDate: string;
  completionStatus: CompletionStatus;
  totalFees: number;
  placementStatus: PlacementStatus;
  companyName: string;
}

interface NewCandidateFields {
  name: string;
  email: string;
  phone: string;
  institute: Institute;
  course: string;
  batch: string;
  trainer: string;
  startDate: string;
  endDate: string;
  totalFees: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enrollmentStatusVariant(status: EnrollmentStatus) {
  switch (status) {
    case 'NEW': return 'secondary' as const;
    case 'APPROVED': return 'default' as const;
    case 'REJECTED': return 'destructive' as const;
  }
}

function completionStatusVariant(status: CompletionStatus) {
  switch (status) {
    case 'ACTIVE': return 'default' as const;
    case 'COMPLETED': return 'outline' as const;
    case 'DROPOUT': return 'destructive' as const;
  }
}

const NEW_CANDIDATE_DEFAULTS: NewCandidateFields = {
  name: '',
  email: '',
  phone: '',
  institute: 'PST',
  course: '',
  batch: '',
  trainer: '',
  startDate: '',
  endDate: '',
  totalFees: 0,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProfileDialog({
  studentId,
  open,
  onOpenChange,
}: {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin', 'student-profile', studentId],
    queryFn: () => adminService.getStudentProfile(studentId),
    enabled: open && !!studentId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : profile ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <ProfileField label="Name" value={profile.name} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Phone" value={profile.phone} />
              <ProfileField label="City" value={profile.city ?? '-'} />
              <ProfileField label="Area" value={profile.area ?? '-'} />

              <Separator />
              <p className="text-sm font-semibold">Education</p>
              <ProfileField label="Graduation" value={profile.graduation ?? '-'} />
              <ProfileField
                label="Graduation Year"
                value={profile.graduationYear?.toString() ?? '-'}
              />
              <ProfileField label="Post Graduation" value={profile.postGraduation ?? '-'} />
              <ProfileField label="PG Year" value={profile.pgYear?.toString() ?? '-'} />
              <ProfileField
                label="Certifications"
                value={profile.certifications.length > 0 ? profile.certifications.join(', ') : '-'}
              />

              <Separator />
              <p className="text-sm font-semibold">Experience</p>
              <ProfileField label="Employment Status" value={profile.employmentStatus} />
              <ProfileField
                label="IT Experience"
                value={`${profile.itExperienceYears} yrs ${profile.itExperienceMonths} mos`}
              />
              <ProfileField
                label="Non-IT Experience"
                value={`${profile.nonItExperienceYears} yrs ${profile.nonItExperienceMonths} mos`}
              />
              {profile.lastWorkedYear && (
                <ProfileField label="Last Worked Year" value={profile.lastWorkedYear.toString()} />
              )}

              <Separator />
              <ProfileField label="Approval State" value={profile.approvalState} />
            </div>
          </ScrollArea>
        ) : (
          <p className="py-4 text-center text-muted-foreground">No profile data found</p>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InstallmentRow({
  installment,
  enrollmentId,
}: {
  installment: Installment;
  enrollmentId: string;
}) {
  const sendReceiptMutation = useMutation({
    mutationFn: () => adminService.sendReceipt(enrollmentId, installment.id),
    onSuccess: () => toast.success(`Receipt sent for installment #${installment.installmentNumber}`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <TableRow>
      <TableCell className="text-sm">#{installment.installmentNumber}</TableCell>
      <TableCell className="text-sm">{formatCurrency(installment.amount)}</TableCell>
      <TableCell className="text-sm">{formatDate(installment.paymentDate)}</TableCell>
      <TableCell>
        <Badge variant="outline">{installment.mode}</Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => sendReceiptMutation.mutate()}
          disabled={sendReceiptMutation.isPending}
        >
          <Send className="h-3 w-3" />
          {sendReceiptMutation.isPending ? 'Sending...' : 'Send Receipt'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ExpandedDetails({ enrollment }: { enrollment: Enrollment }) {
  return (
    <TableRow>
      <TableCell colSpan={10} className="bg-muted/30 p-4">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Course Details */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Course Details</p>
            <Separator />
            <DetailField label="Course" value={enrollment.course} />
            <DetailField label="Batch" value={enrollment.batch} />
            <DetailField label="Trainer" value={enrollment.trainer} />
            <DetailField label="Start Date" value={formatDate(enrollment.startDate)} />
            <DetailField label="End Date" value={formatDate(enrollment.endDate)} />
            <DetailField label="Total Fees" value={formatCurrency(enrollment.totalFees)} />
            <DetailField label="Pending Amount" value={formatCurrency(enrollment.pendingAmount)} />
            {enrollment.certificateUrl && (
              <DetailField label="Certificate" value="Available" />
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Payment Details</p>
            <Separator />
            {enrollment.installments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollment.installments.map((inst) => (
                    <InstallmentRow
                      key={inst.id}
                      installment={inst}
                      enrollmentId={enrollment.id}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">No installments recorded</p>
            )}
          </div>

          {/* Placement Details */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Placement Details</p>
            <Separator />
            <DetailField
              label="Status"
              value={enrollment.placementStatus === 'PLACED' ? 'Placed' : 'Not Placed'}
            />
            {enrollment.companyName && (
              <DetailField label="Company" value={enrollment.companyName} />
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EnrollmentPage() {
  const queryClient = useQueryClient();

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditableFields | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState<NewCandidateFields>(NEW_CANDIDATE_DEFAULTS);

  // Batch end-date confirmation
  const [endDateConfirm, setEndDateConfirm] = useState<{
    enrollmentId: string;
    fields: EditableFields;
  } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInstitute, setFilterInstitute] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Queries & Mutations
  // ---------------------------------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'enrollments', { filterStatus, filterInstitute, filterCourse }],
    queryFn: () =>
      adminService.getEnrollments({
        enrollmentStatus: (filterStatus as EnrollmentStatus) || undefined,
        institute: (filterInstitute as Institute) || undefined,
        course: filterCourse || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Enrollment> }) =>
      adminService.updateEnrollment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] });
      toast.success('Enrollment updated');
      setEditingId(null);
      setEditFields(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] });
      toast.success('Student approved');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminService.rejectStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] });
      toast.success('Student rejected');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Enrollment>) => adminService.createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] });
      toast.success('Candidate created');
      setAddDialogOpen(false);
      setNewCandidate(NEW_CANDIDATE_DEFAULTS);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
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
      enrollmentStatus: enrollment.enrollmentStatus,
      institute: enrollment.institute,
      course: enrollment.course,
      batch: enrollment.batch,
      trainer: enrollment.trainer,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      completionStatus: enrollment.completionStatus,
      totalFees: enrollment.totalFees,
      placementStatus: enrollment.placementStatus,
      companyName: enrollment.companyName ?? '',
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditFields(null);
  }, []);

  const saveEditing = useCallback(
    (enrollment: Enrollment) => {
      if (!editFields) return;

      // Check if end date changed -- requires confirmation because it cascades
      if (editFields.endDate !== enrollment.endDate) {
        setEndDateConfirm({ enrollmentId: enrollment.id, fields: editFields });
        return;
      }

      updateMutation.mutate({ id: enrollment.id, data: editFields });
    },
    [editFields, updateMutation],
  );

  const confirmEndDateUpdate = useCallback(() => {
    if (!endDateConfirm) return;
    updateMutation.mutate({
      id: endDateConfirm.enrollmentId,
      data: endDateConfirm.fields,
    });
    setEndDateConfirm(null);
  }, [endDateConfirm, updateMutation]);

  const handleAddCandidate = useCallback(() => {
    createMutation.mutate(newCandidate as Partial<Enrollment>);
  }, [createMutation, newCandidate]);

  const updateEditField = useCallback(
    <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => {
      setEditFields((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  const updateNewField = useCallback(
    <K extends keyof NewCandidateFields>(key: K, value: NewCandidateFields[K]) => {
      setNewCandidate((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enrollment Management</h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Candidate
          </Button>
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
                <Select value={filterInstitute} onValueChange={setFilterInstitute}>
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
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {COURSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('');
                  setFilterInstitute('');
                  setFilterCourse('');
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Institute</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items && data.items.length > 0 ? (
                    data.items.map((enrollment) => {
                      const isEditing = editingId === enrollment.id;
                      const isExpanded = expandedIds.has(enrollment.id);

                      return (
                        <EnrollmentTableRows
                          key={enrollment.id}
                          enrollment={enrollment}
                          isEditing={isEditing}
                          isExpanded={isExpanded}
                          editFields={isEditing ? editFields : null}
                          onToggleExpand={() => toggleExpand(enrollment.id)}
                          onStartEdit={() => startEditing(enrollment)}
                          onCancelEdit={cancelEditing}
                          onSaveEdit={() => saveEditing(enrollment)}
                          onViewProfile={() => setProfileStudentId(enrollment.studentId)}
                          onApprove={() => approveMutation.mutate(enrollment.id)}
                          onReject={() => rejectMutation.mutate(enrollment.id)}
                          onUpdateField={updateEditField}
                          isSaving={updateMutation.isPending}
                          isApproving={approveMutation.isPending}
                          isRejecting={rejectMutation.isPending}
                        />
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                        No enrollments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Student Profile Dialog */}
        {profileStudentId && (
          <ProfileDialog
            studentId={profileStudentId}
            open={!!profileStudentId}
            onOpenChange={(open) => {
              if (!open) setProfileStudentId(null);
            }}
          />
        )}

        {/* Add New Candidate Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  value={newCandidate.name}
                  onChange={(e) => updateNewField('name', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => updateNewField('email', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input
                  value={newCandidate.phone}
                  onChange={(e) => updateNewField('phone', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Institute</Label>
                <Select
                  value={newCandidate.institute}
                  onValueChange={(v) => updateNewField('institute', v as Institute)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Course</Label>
                <Select
                  value={newCandidate.course}
                  onValueChange={(v) => updateNewField('course', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Batch</Label>
                <Input
                  value={newCandidate.batch}
                  onChange={(e) => updateNewField('batch', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Trainer</Label>
                <Input
                  value={newCandidate.trainer}
                  onChange={(e) => updateNewField('trainer', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newCandidate.startDate}
                  onChange={(e) => updateNewField('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newCandidate.endDate}
                  onChange={(e) => updateNewField('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Total Fees</Label>
                <Input
                  type="number"
                  value={newCandidate.totalFees || ''}
                  onChange={(e) => updateNewField('totalFees', Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCandidate}
                disabled={createMutation.isPending || !newCandidate.name || !newCandidate.email || !newCandidate.phone}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch End Date Confirmation */}
        <AlertDialog
          open={!!endDateConfirm}
          onOpenChange={(open) => {
            if (!open) setEndDateConfirm(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Batch End Date?</AlertDialogTitle>
              <AlertDialogDescription>
                Changing the batch end date will cascade this update to all students
                enrolled in this batch. This action cannot be undone. Are you sure you
                want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmEndDateUpdate}>
                Confirm Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Enrollment Table Row (extracted for readability)
// ---------------------------------------------------------------------------

interface EnrollmentTableRowsProps {
  enrollment: Enrollment;
  isEditing: boolean;
  isExpanded: boolean;
  editFields: EditableFields | null;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onViewProfile: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUpdateField: <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => void;
  isSaving: boolean;
  isApproving: boolean;
  isRejecting: boolean;
}

function EnrollmentTableRows({
  enrollment,
  isEditing,
  isExpanded,
  editFields,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onViewProfile,
  onApprove,
  onReject,
  onUpdateField,
  isSaving,
  isApproving,
  isRejecting,
}: EnrollmentTableRowsProps) {
  return (
    <>
      <TableRow>
        {/* Name */}
        <TableCell className="font-medium">
          {isEditing && editFields ? (
            <Input
              value={editFields.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className="h-8 w-32"
            />
          ) : (
            enrollment.name
          )}
        </TableCell>

        {/* Email */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              type="email"
              value={editFields.email}
              onChange={(e) => onUpdateField('email', e.target.value)}
              className="h-8 w-44"
            />
          ) : (
            <span className="text-sm">{enrollment.email}</span>
          )}
        </TableCell>

        {/* Phone */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.phone}
              onChange={(e) => onUpdateField('phone', e.target.value)}
              className="h-8 w-28"
            />
          ) : (
            <span className="text-sm">{enrollment.phone}</span>
          )}
        </TableCell>

        {/* Enrollment Status */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.enrollmentStatus}
              onValueChange={(v) => onUpdateField('enrollmentStatus', v as EnrollmentStatus)}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={enrollmentStatusVariant(enrollment.enrollmentStatus)}>
              {enrollment.enrollmentStatus}
            </Badge>
          )}
        </TableCell>

        {/* Institute */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.institute}
              onValueChange={(v) => onUpdateField('institute', v as Institute)}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{enrollment.institute}</Badge>
          )}
        </TableCell>

        {/* Course */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.course}
              onValueChange={(v) => onUpdateField('course', v)}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COURSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm">{enrollment.course}</span>
          )}
        </TableCell>

        {/* Batch */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.batch}
              onChange={(e) => onUpdateField('batch', e.target.value)}
              className="h-8 w-24"
            />
          ) : (
            <span className="text-sm">{enrollment.batch}</span>
          )}
        </TableCell>

        {/* Completion Status */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.completionStatus}
              onValueChange={(v) => onUpdateField('completionStatus', v as CompletionStatus)}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={completionStatusVariant(enrollment.completionStatus)}>
              {enrollment.completionStatus}
            </Badge>
          )}
        </TableCell>

        {/* Approval Actions */}
        <TableCell>
          {enrollment.enrollmentStatus === 'NEW' ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={onApprove}
                disabled={isApproving}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={onReject}
                disabled={isRejecting}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onSaveEdit}
                  disabled={isSaving}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button variant="ghost" size="xs" onClick={onCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="xs" onClick={onStartEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="xs" onClick={onViewProfile}>
                  <User className="h-3.5 w-3.5" />
                  Profile
                </Button>
                <Button variant="ghost" size="xs" onClick={onToggleExpand}>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Expand
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && <ExpandedDetails enrollment={enrollment} />}
    </>
  );
}
