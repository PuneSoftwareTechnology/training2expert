import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestFormValues } from "../../schemas/test.schema";

interface TestFormFieldsProps {
  form: UseFormReturn<TestFormValues>;
  courses: string[];
}

export function TestFormFields({ form, courses }: TestFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Title *</Label>
          <Input {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Course *</Label>
          <Select
            value={form.watch("course") || undefined}
            onValueChange={(v) =>
              form.setValue("course", v, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.course && (
            <p className="text-xs text-destructive">
              {form.formState.errors.course.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Duration (min) *</Label>
          <Input type="number" {...form.register("durationMinutes")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          {...form.register("description")}
          placeholder="Optional test description"
          rows={2}
        />
      </div>
    </>
  );
}
