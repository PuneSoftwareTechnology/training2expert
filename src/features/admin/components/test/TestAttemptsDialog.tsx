import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminService } from "@/services/admin.service";

interface TestAttemptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string | null;
  testTitle: string;
}

function getScoreBadge(score: number, totalMarks: number) {
  if (totalMarks === 0) return "secondary";
  const pct = (score / totalMarks) * 100;
  if (pct >= 60) return "success";
  if (pct >= 40) return "warning";
  return "destructive";
}

export function TestAttemptsDialog({
  open,
  onOpenChange,
  testId,
  testTitle,
}: TestAttemptsDialogProps) {
  const { data: attempts, isLoading } = useQuery({
    queryKey: ["admin", "tests", testId, "attempts"],
    queryFn: () => adminService.getTestAttempts(testId!),
    enabled: !!testId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            Attempts — {testTitle}
          </DialogTitle>
          {attempts && attempts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {attempts.length} total attempt
              {attempts.length !== 1 ? "s" : ""}
            </p>
          )}
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !attempts || attempts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No attempts yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Score</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {attempt.studentName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {attempt.studentEmail}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getScoreBadge(
                            attempt.score,
                            attempt.totalMarks,
                          ) as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                      >
                        {attempt.score}/{attempt.totalMarks}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attempt.status === "submitted"
                            ? "success"
                            : attempt.status === "expired"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {attempt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
