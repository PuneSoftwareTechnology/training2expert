import { Plus, Trash2 } from "lucide-react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TestFormValues } from "../../schemas/test.schema";

interface TestQuestionFieldsProps {
  form: UseFormReturn<TestFormValues>;
  fieldArray: UseFieldArrayReturn<TestFormValues, "questions">;
}

export function TestQuestionFields({
  form,
  fieldArray,
}: TestQuestionFieldsProps) {
  const { fields, append, remove } = fieldArray;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Questions</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              question: "",
              options: ["", "", "", ""],
              correctOptionIndex: 0,
              marks: 1,
            })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-start justify-between">
              <Label className="font-medium">Question {index + 1}</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Marks:
                  </Label>
                  <Input
                    type="number"
                    {...form.register(`questions.${index}.marks`)}
                    className="h-7 w-16"
                    min={1}
                  />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <Input
              {...form.register(`questions.${index}.question`)}
              placeholder="Enter question"
            />

            <div className="space-y-2">
              <Label className="text-xs">Options (mark correct answer)</Label>
              <RadioGroup
                value={String(
                  form.watch(`questions.${index}.correctOptionIndex`),
                )}
                onValueChange={(v) =>
                  form.setValue(
                    `questions.${index}.correctOptionIndex`,
                    Number(v),
                  )
                }
              >
                {[0, 1, 2, 3].map((optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={String(optIdx)}
                      id={`${field.id}-opt${optIdx}`}
                    />
                    <Input
                      {...form.register(
                        `questions.${index}.options.${optIdx}`,
                      )}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
