import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedQuestion {
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  marks: number;
}

interface CsvTestUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// CSV example template
// ---------------------------------------------------------------------------

const CSV_EXAMPLE = `Question,Option A,Option B,Option C,Option D,Correct Option,Marks
What is the capital of France?,Berlin,Madrid,Paris,Rome,3,1
Which planet is closest to the Sun?,Venus,Mercury,Earth,Mars,2,1
What does HTML stand for?,Hyper Text Markup Language,High Tech Modern Language,Hyper Transfer Markup Language,Home Tool Markup Language,1,2`;

function downloadExampleCsv() {
  const blob = new Blob([CSV_EXAMPLE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "test_questions_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(raw: string): {
  questions: ParsedQuestion[];
  errors: string[];
} {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2)
    return {
      questions: [],
      errors: ["CSV must have a header row and at least one data row."],
    };

  // Skip header
  const errors: string[] = [];
  const questions: ParsedQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    if (cols.length < 6) {
      errors.push(
        `Row ${rowNum}: Expected at least 6 columns, got ${cols.length}.`,
      );
      continue;
    }

    const [question, optA, optB, optC, optD, correctStr, marksStr] = cols;

    if (!question) {
      errors.push(`Row ${rowNum}: Question text is empty.`);
      continue;
    }
    if (!optA || !optB || !optC || !optD) {
      errors.push(`Row ${rowNum}: All 4 options are required.`);
      continue;
    }

    const correct = parseInt(correctStr, 10);
    if (isNaN(correct) || correct < 1 || correct > 4) {
      errors.push(
        `Row ${rowNum}: Correct Option must be 1-4, got "${correctStr}".`,
      );
      continue;
    }

    const marks = marksStr ? parseInt(marksStr, 10) : 1;
    if (isNaN(marks) || marks < 1) {
      errors.push(
        `Row ${rowNum}: Marks must be at least 1, got "${marksStr}".`,
      );
      continue;
    }

    questions.push({
      question,
      options: [optA, optB, optC, optD],
      correctOptionIndex: correct - 1,
      marks,
    });
  }

  return { questions, errors };
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

type Step = "upload" | "preview";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CsvTestUploadDialog({
  open,
  onOpenChange,
}: CsvTestUploadDialogProps) {
  const queryClient = useQueryClient();

  // Step
  const [step, setStep] = useState<Step>("upload");

  // Upload state
  const [csvText, setCsvText] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview / edit state
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: adminService.getCourses,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
      toast.success("Test created successfully");
      resetAndClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resetAndClose = useCallback(() => {
    setStep("upload");
    setCsvText("");
    setParseErrors([]);
    setQuestions([]);
    setTitle("");
    setDescription("");
    setCourse("");
    setDurationMinutes(30);
    setConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // --- Upload handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText((evt.target?.result as string) || "");
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleParse = () => {
    if (!csvText.trim()) {
      toast.error("Please upload a CSV file or paste CSV content.");
      return;
    }
    const { questions: parsed, errors } = parseCsv(csvText);
    setParseErrors(errors);

    if (parsed.length === 0) {
      toast.error("No valid questions found. Check errors below.");
      return;
    }

    setQuestions(parsed);
    setStep("preview");
    if (errors.length > 0) {
      toast.warning(
        `${parsed.length} questions parsed, ${errors.length} rows had errors.`,
      );
    } else {
      toast.success(`${parsed.length} questions parsed successfully.`);
    }
  };

  // --- Preview handlers ---

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const updateQuestion = (idx: number, patch: Partial<ParsedQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEmptyQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        marks: 1,
      },
    ]);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Test title is required.");
      return;
    }
    if (!course) {
      toast.error("Please select a course.");
      return;
    }
    if (questions.length === 0) {
      toast.error("At least one question is required.");
      return;
    }
    // Check all questions have text and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty.`);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        toast.error(`Question ${i + 1} has empty options.`);
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleConfirmCreate = () => {
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      course,
      durationMinutes,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        marks: q.marks,
      })),
    });
    setConfirmOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => (o ? onOpenChange(o) : resetAndClose())}
      >
        <DialogContent className="max-h-[92vh] w-[65vw] !max-w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {step === "upload" ? "Upload Test CSV" : "Preview & Edit Test"}
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="space-y-5">
              {/* Instructions */}
              <Card className="border-sky-300 bg-sky-50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-sky-100 p-1">
                      <FileSpreadsheet className="h-4 w-4 text-sky-600" />
                    </div>
                    <p className="text-sm font-semibold text-sky-800">
                      CSV Format — Example
                    </p>
                  </div>
                  <p className="text-xs text-sky-700">
                    Your CSV must have these columns in order. Here's how it
                    should look:
                  </p>
                  <div className="overflow-x-auto rounded-md border border-sky-200 bg-white">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-sky-100/70">
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Question
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Option A
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Option B
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Option C
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Option D
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Correct Option
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-sky-900">
                            Marks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-3 py-1.5 text-sky-800">
                            What is 2+2?
                          </td>
                          <td className="px-3 py-1.5">3</td>
                          <td className="px-3 py-1.5 font-medium text-emerald-600 bg-emerald-50/50">
                            4 ✓
                          </td>
                          <td className="px-3 py-1.5">5</td>
                          <td className="px-3 py-1.5">6</td>
                          <td className="px-3 py-1.5 font-bold text-sky-700">
                            2
                          </td>
                          <td className="px-3 py-1.5">1</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-1.5 text-sky-800">
                            Capital of India?
                          </td>
                          <td className="px-3 py-1.5">Mumbai</td>
                          <td className="px-3 py-1.5 font-medium text-emerald-600 bg-emerald-50/50">
                            Delhi ✓
                          </td>
                          <td className="px-3 py-1.5">Chennai</td>
                          <td className="px-3 py-1.5">Kolkata</td>
                          <td className="px-3 py-1.5 font-bold text-sky-700">
                            2
                          </td>
                          <td className="px-3 py-1.5">1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-md bg-sky-100/60 px-3 py-2 text-xs text-sky-800 space-y-1">
                    <p>
                      <strong>Correct Option</strong> = column number of the
                      right answer: <strong>1</strong> = Option A,{" "}
                      <strong>2</strong> = Option B, <strong>3</strong> = Option
                      C, <strong>4</strong> = Option D
                    </p>
                    <p>
                      <strong>Marks</strong> column is optional (defaults to 1
                      if omitted)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-sky-300 text-sky-700 hover:bg-sky-100"
                    onClick={downloadExampleCsv}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download Example CSV
                  </Button>
                </CardContent>
              </Card>

              {/* Upload area */}
              <div
                className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Click to upload a <strong>.csv</strong> file or drag & drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Or paste */}
              <div className="space-y-2 bg-yellow-200 p-2 rounded-md">
                <Label className="text-sm">Or paste CSV content directly</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  placeholder={`Question,Option A,Option B,Option C,Option D,Correct Option,Marks\nWhat is 2+2?,3,4,5,6,2,1`}
                  className="font-mono text-xs bg-white"
                />
              </div>

              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-medium text-destructive">
                        Errors found
                      </p>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs text-destructive">
                      {parseErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button onClick={handleParse} disabled={!csvText.trim()}>
                  Parse & Preview
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-5">
              {/* Test metadata */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Test Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JavaScript Basics"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Course *</Label>
                  <Select value={course || undefined} onValueChange={setCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Duration (min) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional test description"
                  rows={2}
                />
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm py-1 px-3">
                  {questions.length} Questions
                </Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">
                  Total Marks: {totalMarks}
                </Badge>
                {parseErrors.length > 0 && (
                  <Badge variant="destructive" className="text-sm py-1 px-3">
                    {parseErrors.length} rows skipped
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Editable questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmptyQuestion}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
                  </Button>
                </div>

                {questions.map((q, idx) => (
                  <Card key={idx}>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between">
                        <Label className="font-medium">
                          Question {idx + 1}
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Marks:
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={q.marks}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  marks: parseInt(e.target.value) || 1,
                                })
                              }
                              className="h-7 w-16"
                            />
                          </div>
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(idx)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <Input
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(idx, { question: e.target.value })
                        }
                        placeholder="Enter question"
                      />

                      <div className="space-y-2">
                        <Label className="text-xs">
                          Options (mark correct answer)
                        </Label>
                        <RadioGroup
                          value={String(q.correctOptionIndex)}
                          onValueChange={(v) =>
                            updateQuestion(idx, {
                              correctOptionIndex: Number(v),
                            })
                          }
                        >
                          {[0, 1, 2, 3].map((optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={String(optIdx)}
                                id={`csv-q${idx}-opt${optIdx}`}
                              />
                              <Input
                                value={q.options[optIdx]}
                                onChange={(e) => {
                                  const newOpts = [...q.options] as [
                                    string,
                                    string,
                                    string,
                                    string,
                                  ];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(idx, { options: newOpts });
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                                className={
                                  q.correctOptionIndex === optIdx
                                    ? "flex-1 border-green-400 bg-green-50/50"
                                    : "flex-1"
                                }
                              />
                              {q.correctOptionIndex === optIdx && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setQuestions([]);
                  }}
                >
                  Back to Upload
                </Button>
                <Button onClick={handleSave} loading={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Save Test"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Test?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Please confirm the test details:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>Title:</strong> {title}
                  </li>
                  <li>
                    <strong>Course:</strong> {course}
                  </li>
                  <li>
                    <strong>Duration:</strong> {durationMinutes} minutes
                  </li>
                  <li>
                    <strong>Questions:</strong> {questions.length}
                  </li>
                  <li>
                    <strong>Total Marks:</strong> {totalMarks}
                  </li>
                </ul>
                <p className="pt-1 font-medium">
                  Have you checked everything? All good?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back & Review</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              Yes, Create Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
