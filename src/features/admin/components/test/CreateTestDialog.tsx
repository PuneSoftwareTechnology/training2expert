import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { TestFormFields } from "./TestFormFields";
import { TestQuestionFields } from "./TestQuestionFields";

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateTestDialog({
  open,
  onOpenChange,
}: CreateTestDialogProps) {
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

  const createMutation = useMutation({
    mutationFn: adminService.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
      toast.success("Test created");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <TestFormFields form={form} courses={courses} />
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
            <Button type="submit" loading={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
