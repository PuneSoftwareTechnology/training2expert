import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  PenLine,
  Pencil,
  Trash2,
  Power,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CardSkeleton } from "@/components/loaders/CardSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { CreateTestDialog } from "../components/test/CreateTestDialog";
import { CsvTestUploadDialog } from "../components/test/CsvTestUploadDialog";
import { EditTestDialog } from "../components/test/EditTestDialog";
import { ViewTestDialog } from "../components/test/ViewTestDialog";
import { TestAttemptsDialog } from "../components/test/TestAttemptsDialog";

export default function TestManagementPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [viewingTestId, setViewingTestId] = useState<string | null>(null);
  const [attemptsTestId, setAttemptsTestId] = useState<string | null>(null);
  const [attemptsTestTitle, setAttemptsTestTitle] = useState("");
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "tests", currentPage],
    queryFn: () => adminService.getTests({ page: currentPage }),
  });

  const tests = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleTestActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
      toast.success("Test status updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
      toast.success("Test deleted");
      setDeleteTestId(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 shadow-md shadow-teal-200/50">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Test Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage assessments for your students
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions
              onRefresh={refetch}
              isFetching={isFetching}
              showReset={false}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-200/50 hover:from-teal-600 hover:to-cyan-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Test
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                  <PenLine className="mr-2 h-4 w-4" />
                  Create Manually
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Upload CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!tests || tests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">No tests created yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Get started by creating your first test
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">S.No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-center">Time</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test, idx) => (
                  <TableRow
                    key={test.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setViewingTestId(test.id)}
                  >
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {(currentPage - 1) * 10 + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      {test.description ? (
                        <span className="line-clamp-2" title={test.description}>
                          {test.description}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{test.course || "—"}</TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {test.questionCount ?? test.questions?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {test.totalMarks}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {test.durationMinutes}m
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto gap-1 p-0 text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          setAttemptsTestId(test.id);
                          setAttemptsTestTitle(test.title);
                        }}
                      >
                        <Users className="h-3 w-3" />
                        {test.attemptCount ?? 0}
                      </Button>
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const isTogglingThis =
                          toggleMutation.isPending &&
                          toggleMutation.variables === test.id;
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={isTogglingThis}
                            className="h-7 gap-1 px-2"
                            onClick={() => toggleMutation.mutate(test.id)}
                            title={test.isPublished ? "Unpublish" : "Publish"}
                          >
                            {!isTogglingThis && <Power className="h-3 w-3" />}
                            <Badge
                              variant={test.isPublished ? "success" : "secondary"}
                              className="text-[10px]"
                            >
                              {test.isPublished ? "Published" : "Unpublished"}
                            </Badge>
                          </Button>
                        );
                      })()}
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={() => setEditingTestId(test.id)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTestId(test.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
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
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <CreateTestDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
        <CsvTestUploadDialog
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
        />
        <EditTestDialog
          open={!!editingTestId}
          onOpenChange={(open) => {
            if (!open) setEditingTestId(null);
          }}
          testId={editingTestId}
        />
        <ViewTestDialog
          open={!!viewingTestId}
          onOpenChange={(open) => {
            if (!open) setViewingTestId(null);
          }}
          testId={viewingTestId}
        />
        <TestAttemptsDialog
          open={!!attemptsTestId}
          onOpenChange={(open) => {
            if (!open) setAttemptsTestId(null);
          }}
          testId={attemptsTestId}
          testTitle={attemptsTestTitle}
        />

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTestId}
          onOpenChange={() => setDeleteTestId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                test and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  deleteTestId && deleteMutation.mutate(deleteTestId)
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
