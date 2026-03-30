import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService } from "@/services/admin.service";

interface ViewTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string | null;
}

export function ViewTestDialog({
  open,
  onOpenChange,
  testId,
}: ViewTestDialogProps) {
  const { data: testDetail, isLoading } = useQuery({
    queryKey: ["admin", "tests", testId],
    queryFn: () => adminService.getTestById(testId!),
    enabled: !!testId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            {testDetail?.title ?? "Test Preview"}
          </DialogTitle>
          {testDetail && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge
                variant={testDetail.isPublished ? "success" : "secondary"}
              >
                {testDetail.isPublished ? "Published" : "Draft"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {testDetail.course}
              </span>
              <span className="text-sm text-muted-foreground">
                {testDetail.durationMinutes} min
              </span>
              <span className="text-sm text-muted-foreground">
                {testDetail.totalMarks} marks
              </span>
            </div>
          )}
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !testDetail?.questions?.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No questions in this test
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {testDetail.questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1.5">
                      Q{idx + 1}.
                    </span>
                    {q.question}
                  </p>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctAnswer
                      ? opt === q.correctAnswer
                      : optIdx === q.correctOptionIndex;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                          isCorrect
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800"
                            : "bg-muted/50"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                        )}
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
