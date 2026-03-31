import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { EditTestDialog } from "../components/test/EditTestDialog";
import { ViewTestDialog } from "../components/test/ViewTestDialog";
import { TestAttemptsDialog } from "../components/test/TestAttemptsDialog";
import { TestCard } from "../components/test/TestCard";

export default function TestManagementPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
            <Button
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-200/50 hover:from-teal-600 hover:to-cyan-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Test
            </Button>
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onView={(id) => setViewingTestId(id)}
                onEdit={(id) => setEditingTestId(id)}
                onViewAttempts={(id, title) => {
                  setAttemptsTestId(id);
                  setAttemptsTestTitle(title);
                }}
                onTogglePublish={(id) => toggleMutation.mutate(id)}
                onDelete={(id) => setDeleteTestId(id)}
                isToggling={toggleMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
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
