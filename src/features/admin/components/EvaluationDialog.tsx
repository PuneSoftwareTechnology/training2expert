import { useState } from "react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  const totalScored = evaluations.reduce((sum, e) => sum + e.technicalMarksScored, 0);
  const totalPossible = evaluations.reduce((sum, e) => sum + e.technicalTotalMarks, 0);
  const avgTechnicalPct = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
  const avgCommunication =
    evaluations.length > 0
      ? +(
          evaluations.reduce((sum, e) => sum + e.communicationScore, 0) /
          evaluations.length
        ).toFixed(1)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Evaluation Details</DialogTitle>
          <DialogDescription>
            View technical scores, communication ratings, project submissions,
            and trainer remarks for this student. Communication rating is editable by admins.
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
              <Badge variant="secondary" className="ml-auto text-[10px]">
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
                  {totalScored}/{totalPossible}
                </p>
                <p className="text-xs text-blue-500">
                  ({avgTechnicalPct}%)
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

            {/* Per-course evaluations */}
            <div className="space-y-4 px-6 pb-6">
              {evaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} studentId={studentId} />
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

function EvaluationCard({ evaluation, studentId }: { evaluation: Evaluation; studentId: string }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const updateMutation = useMutation({
    mutationFn: (score: number) =>
      adminService.updateEvaluation(evaluation.id, { communicationScore: score }),
    onSuccess: () => {
      toast.success("Communication rating updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "student-profile", studentId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleStarClick = (starIndex: number) => {
    if (!canEdit || updateMutation.isPending) return;
    const newScore = (starIndex + 1) * 2; // each star = 2 points on 0-10 scale
    updateMutation.mutate(newScore);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Course Header */}
      <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-semibold">{evaluation.courseName}</span>
      </div>

      <div className="space-y-4 p-4">
        {/* Core Metrics */}
        <div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Core Evaluation Metrics
          </p>

          {/* Technical Score */}
          <MetricBar
            label="Technical Mastery"
            value={evaluation.technicalMarksScored}
            max={evaluation.technicalTotalMarks}
            color="bg-blue-500"
          />

          {/* Communication — editable stars for admin/super_admin */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Communication Rating</span>
            <div className="flex items-center gap-1">
              {updateMutation.isPending && (
                <Loader2 className="h-3 w-3 animate-spin text-amber-500 mr-1" />
              )}
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = hoveredStar !== null
                  ? hoveredStar + 1
                  : evaluation.communicationScore / 2;
                return (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 transition-colors ${
                      i < Math.floor(filled)
                        ? "fill-amber-400 text-amber-400"
                        : i < filled
                          ? "fill-amber-400/50 text-amber-400"
                          : "text-muted-foreground/25"
                    } ${canEdit ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                    onMouseEnter={() => canEdit && setHoveredStar(i)}
                    onMouseLeave={() => canEdit && setHoveredStar(null)}
                    onClick={() => handleStarClick(i)}
                  />
                );
              })}
              <span className="text-xs text-muted-foreground ml-1 tabular-nums">
                {hoveredStar !== null ? (hoveredStar + 1) * 2 : evaluation.communicationScore}/10
              </span>
            </div>
          </div>

          {/* Module Scores */}
          {evaluation.moduleScores &&
            evaluation.moduleScores.length > 0 &&
            evaluation.moduleScores.map((mod) => (
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

        {/* Submission Log */}
        {evaluation.projectSubmission && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submission Log
              </p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                1 Project
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() =>
                window.open(evaluation.projectSubmission, "_blank")
              }
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                <FileText className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">Project Submission</p>
                <p className="text-[10px] text-muted-foreground">
                  View uploaded file
                </p>
              </div>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}

        {/* Scope for Improvement */}
        {evaluation.scopeForImprovement && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scope for Improvement
              </p>
            </div>
            <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900 italic">
              {evaluation.scopeForImprovement}
            </p>
          </div>
        )}

        {/* Trainer's Remark */}
        {evaluation.trainerRemark && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trainer Remarks
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-2.5 w-2.5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Instructor / Advisor
                </span>
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{evaluation.trainerRemark}&rdquo;
              </p>
            </div>
          </div>
        )}
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
