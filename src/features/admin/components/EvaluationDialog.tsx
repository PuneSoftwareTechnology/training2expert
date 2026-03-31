import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MessageSquare,
  FileText,
  Lightbulb,
  Star,
  ExternalLink,
  BookOpen,
  UserCheck,
  Loader2,
  Check,
  Pencil,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/constants/roles";
import type { Evaluation } from "@/types/student.types";

interface EvaluationDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EvaluationDialog({
  studentId,
  open,
  onOpenChange,
}: EvaluationDialogProps) {
  // Reuse the same profile query — react-query caches by key
  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin", "student-profile", studentId],
    queryFn: () => adminService.getStudentProfile(studentId),
    enabled: open && !!studentId,
  });

  const evaluations = profile?.evaluations ?? [];
  const studentName = profile?.name;
  const studentPhoto = profile?.profilePhoto;

  // Compute aggregate scores across all evaluations
  const totalScored = evaluations.reduce(
    (sum, e) => sum + e.technicalMarksScored,
    0,
  );
  const totalPossible = evaluations.reduce(
    (sum, e) => sum + e.technicalTotalMarks,
    0,
  );
  const avgTechnicalPct =
    totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
  const avgCommunication =
    evaluations.length > 0
      ? +(
          evaluations.reduce((sum, e) => sum + e.communicationScore, 0) /
          evaluations.length
        ).toFixed(1)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Custom close button — visible on dark header */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white shadow-md transition-colors hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader className="sr-only">
          <DialogTitle>Evaluation Details</DialogTitle>
          <DialogDescription>
            View technical scores, communication ratings, project submissions,
            and trainer remarks for this student. Communication rating is
            editable by admins.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : evaluations.length > 0 ? (
          <ScrollArea className="max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-6 py-4">
              <Avatar className="h-11 w-11">
                {studentPhoto && (
                  <AvatarImage src={studentPhoto} alt={studentName ?? ""} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {studentName ? getInitials(studentName) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold leading-tight truncate">
                  {studentName || "Student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {evaluations.length} course evaluation
                  {evaluations.length > 1 ? "s" : ""}
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto mr-8 text-[10px]">
                Evaluation
              </Badge>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4">
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Technical Score
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {totalScored}/{totalPossible}{" "}
                  <p className="text-xs text-blue-500">({avgTechnicalPct}%)</p>
                </p>
              </div>
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Communication
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {avgCommunication}
                  <span className="text-sm font-normal text-amber-500">
                    /10
                  </span>
                </p>
              </div>
            </div>

            {/* Project Submissions */}
            {profile?.projectSubmissions &&
              profile.projectSubmissions.length > 0 && (
                <div className="px-6 pb-2">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Project Submissions
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {profile.projectSubmissions.length} Project
                      {profile.projectSubmissions.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {profile.projectSubmissions.map((project, idx) => (
                        <Button
                          key={project.id}
                          variant="outline"
                          size="sm"
                          className="h-auto justify-start gap-2 bg-white py-2"
                          onClick={() => window.open(project.url, "_blank")}
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-xs font-medium">
                              Project {idx + 1}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Per-course evaluations */}
            <div className="space-y-4 px-6 pb-6">
              {evaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  studentId={studentId}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No evaluation data found for this student.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Evaluation Card
// ---------------------------------------------------------------------------

function EvaluationCard({
  evaluation,
  studentId,
}: {
  evaluation: Evaluation;
  studentId: string;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit =
    user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Editable states for scope and remark
  const [editingScope, setEditingScope] = useState(false);
  const [editingRemark, setEditingRemark] = useState(false);
  const [scopeValue, setScopeValue] = useState(
    evaluation.scopeForImprovement ?? "",
  );
  const [remarkValue, setRemarkValue] = useState(
    evaluation.trainerRemark ?? "",
  );

  useEffect(() => {
    setScopeValue(evaluation.scopeForImprovement ?? "");
    setRemarkValue(evaluation.trainerRemark ?? "");
  }, [evaluation.scopeForImprovement, evaluation.trainerRemark]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Evaluation>) =>
      adminService.updateEvaluation(evaluation.id, data),
    onSuccess: (_data, variables) => {
      const msg =
        variables.communicationScore !== undefined
          ? "Communication rating updated"
          : variables.scopeForImprovement !== undefined
            ? "Scope for improvement updated"
            : "Trainer remark updated";
      toast.success(msg);
      queryClient.invalidateQueries({
        queryKey: ["admin", "student-profile", studentId],
      });
      setEditingScope(false);
      setEditingRemark(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleStarClick = (starIndex: number) => {
    if (!canEdit || updateMutation.isPending) return;
    const newScore = (starIndex + 1) * 2;
    updateMutation.mutate({ communicationScore: newScore });
  };

  const handleSaveScope = () => {
    updateMutation.mutate({ scopeForImprovement: scopeValue });
  };

  const handleSaveRemark = () => {
    updateMutation.mutate({ trainerRemark: remarkValue });
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Course Header */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2.5">
        <BookOpen className="h-3.5 w-3.5 text-white/80" />
        <span className="text-sm font-semibold text-white">
          {evaluation.courseName}
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION 1 — Performance Scores                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-blue-100">
        {/* Section header */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-blue-100">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10">
            <Star className="h-3 w-3 text-blue-600" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Performance Scores
          </p>
        </div>

        {/* Scores row — Technical + Communication side by side */}
        <div className="grid grid-cols-2 divide-x divide-blue-100">
          {/* Technical Mastery */}
          <div className="p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
              Technical Mastery
            </p>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-bold text-blue-700 tabular-nums leading-none">
                {evaluation.technicalMarksScored}
              </span>
              <span className="text-sm text-blue-400 font-medium leading-none pb-0.5">
                / {evaluation.technicalTotalMarks}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{
                  width: `${evaluation.technicalTotalMarks > 0 ? Math.min((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-blue-400 tabular-nums">
              {evaluation.technicalTotalMarks > 0
                ? Math.round(
                    (evaluation.technicalMarksScored /
                      evaluation.technicalTotalMarks) *
                      100,
                  )
                : 0}
              % achieved
            </p>
          </div>

          {/* Communication Rating */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                Communication Rating
              </p>
              {canEdit && (
                <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-600">
                  <Pencil className="h-2.5 w-2.5" />
                  Editable
                </span>
              )}
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-bold text-purple-600 tabular-nums leading-none">
                {hoveredStar !== null
                  ? (hoveredStar + 1) * 2
                  : evaluation.communicationScore}
              </span>
              <span className="text-sm text-purple-400 font-medium leading-none pb-0.5">
                / 10
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${canEdit ? "bg-purple-50 border border-dashed border-purple-300" : ""}`}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-3 w-3 animate-spin text-purple-500 mr-1" />
              )}
              {Array.from({ length: 5 }).map((_, i) => {
                const filled =
                  hoveredStar !== null
                    ? hoveredStar + 1
                    : evaluation.communicationScore / 2;
                return (
                  <Star
                    key={i}
                    className={`h-5 w-5 transition-all ${
                      i < Math.floor(filled)
                        ? "fill-purple-400 text-purple-400 drop-shadow-sm"
                        : i < filled
                          ? "fill-purple-400/50 text-purple-400"
                          : canEdit
                            ? "text-purple-200 hover:text-purple-300"
                            : "text-muted-foreground/20"
                    } ${canEdit ? "cursor-pointer hover:scale-130 active:scale-95 transition-transform" : ""}`}
                    onMouseEnter={() => canEdit && setHoveredStar(i)}
                    onMouseLeave={() => canEdit && setHoveredStar(null)}
                    onClick={() => handleStarClick(i)}
                  />
                );
              })}
            </div>
            {canEdit && (
              <p className="text-[10px] text-purple-500 italic">
                ↑ Click stars to rate
              </p>
            )}
          </div>
        </div>

        {/* Module Scores (full-width under the row) */}
        {evaluation.moduleScores && evaluation.moduleScores.length > 0 && (
          <div className="border-t border-blue-100 px-4 py-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2">
              Module Breakdown
            </p>
            {evaluation.moduleScores.map((mod) => (
              <MetricBar
                key={mod.moduleName}
                label={mod.moduleName}
                value={mod.score}
                max={100}
                suffix="%"
                color="bg-indigo-400"
              />
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION 2 — Feedback & Growth                             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 border-b border-amber-100">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10">
            <Lightbulb className="h-3 w-3 text-amber-600" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Feedback &amp; Growth
          </p>
        </div>

        <div className="space-y-4 p-4">
          {/* Scope for Improvement */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-amber-700">
                Scope for Improvement
              </p>
              {canEdit && !editingScope && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() => setEditingScope(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingScope ? (
              <div className="space-y-2">
                <Textarea
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  placeholder="Enter scope for improvement..."
                  className="min-h-[80px] text-sm border-amber-200 focus-visible:ring-amber-400"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingScope(false);
                      setScopeValue(evaluation.scopeForImprovement ?? "");
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveScope}
                    disabled={updateMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : evaluation.scopeForImprovement ? (
              <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-900 italic leading-relaxed">
                {evaluation.scopeForImprovement}
              </p>
            ) : (
              <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50/30 px-3 py-2 text-sm text-muted-foreground italic">
                No scope for improvement added yet.
                {canEdit && (
                  <button
                    className="ml-1 text-amber-600 font-medium underline underline-offset-2 hover:text-amber-800"
                    onClick={() => setEditingScope(true)}
                  >
                    Add one
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200" />

          {/* Trainer's Remark */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-teal-500" />
              <p className="text-xs font-semibold text-teal-700">
                Trainer Remarks
              </p>
              {canEdit && !editingRemark && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto text-teal-500 hover:text-teal-700 hover:bg-teal-50"
                  onClick={() => setEditingRemark(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingRemark ? (
              <div className="space-y-2">
                <Textarea
                  value={remarkValue}
                  onChange={(e) => setRemarkValue(e.target.value)}
                  placeholder="Enter trainer remark..."
                  className="min-h-[80px] text-sm border-teal-200 focus-visible:ring-teal-400"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRemark(false);
                      setRemarkValue(evaluation.trainerRemark ?? "");
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveRemark}
                    disabled={updateMutation.isPending}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : evaluation.trainerRemark ? (
              <div className="rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/10">
                    <MessageSquare className="h-2.5 w-2.5 text-teal-600" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                    Instructor / Advisor
                  </span>
                </div>
                <p className="text-sm italic leading-relaxed text-teal-900">
                  &ldquo;{evaluation.trainerRemark}&rdquo;
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-teal-200 bg-teal-50/30 px-3 py-2 text-sm text-muted-foreground italic">
                No trainer remark added yet.
                {canEdit && (
                  <button
                    className="ml-1 text-teal-600 font-medium underline underline-offset-2 hover:text-teal-800"
                    onClick={() => setEditingRemark(true)}
                  >
                    Add one
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Progress Bar
// ---------------------------------------------------------------------------

function MetricBar({
  label,
  value,
  max,
  suffix = "",
  color = "bg-primary",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 max-w-[55%]">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-right whitespace-nowrap">
          {suffix ? `${value}${suffix}` : `${value}/${max}`}
        </span>
      </div>
    </div>
  );
}
