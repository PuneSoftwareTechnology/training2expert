import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { testSchema, type TestFormValues } from "../../schemas/test.schema";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import type { Test } from "@/types/common.types";
import { TestFormFields } from "./TestFormFields";
import { TestQuestionFields } from "./TestQuestionFields";

interface EditTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string | null;
}

const defaultValues: TestFormValues = {
  title: "",
  description: "",
  course: "",
  durationMinutes: 1,
  questions: [
    {
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      marks: 1,
    },
  ],
};

export function EditTestDialog({
  open,
  onOpenChange,
  testId,
}: EditTestDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema) as Resolver<TestFormValues>,
    defaultValues,
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: adminService.getCourses,
  });

  const { data: testDetail, isLoading: testLoading } = useQuery({
    queryKey: ["admin", "tests", testId],
    queryFn: () => adminService.getTestById(testId!),
    enabled: !!testId && open,
  });

  // Populate form when test detail loads
  useEffect(() => {
    if (testDetail && open) {
      const questions = (testDetail.questions || []).map((q) => {
        const correctIdx = q.correctAnswer
          ? q.options.indexOf(q.correctAnswer)
          : (q.correctOptionIndex ?? 0);
        return {
          question: q.question,
          options: q.options.length === 4 ? q.options : ["", "", "", ""],
          correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
          marks: q.marks ?? 1,
        };
      });

      form.reset({
        title: testDetail.title,
        description: testDetail.description || "",
        course: testDetail.course,
        durationMinutes: testDetail.durationMinutes,
        questions:
          questions.length > 0
            ? questions
            : [
                {
                  question: "",
                  options: ["", "", "", ""],
                  correctOptionIndex: 0,
                  marks: 1,
                },
              ],
      });
    }
  }, [testDetail, open, form]);

  // Ensure the test's current course is always in the dropdown,
  // even if the courses list hasn't loaded yet or doesn't include it
  const allCourses = useMemo(() => {
    if (!testDetail?.course) return courses;
    if (courses.includes(testDetail.course)) return courses;
    return [testDetail.course, ...courses];
  }, [courses, testDetail?.course]);

  const updateMutation = useMutation({
    mutationFn: (data: TestFormValues) =>
      adminService.updateTest(testId!, data as unknown as Partial<Test>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
      toast.success("Test updated");
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
        </DialogHeader>
        {testLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <TestFormFields form={form} courses={allCourses} />
            <Separator />
            <TestQuestionFields form={form} fieldArray={fieldArray} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
