import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Power, FileText, Loader2, Pencil, Clock, BookOpen, HelpCircle, Award, Eye, Users, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { testSchema, type TestFormValues } from '../schemas/test.schema';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import type { Test } from '@/types/common.types';


export default function TestManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [attemptsDialogOpen, setAttemptsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTestId, setViewingTestId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTestTitle, setSelectedTestTitle] = useState('');

  const { data: tests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'tests'],
    queryFn: adminService.getTests,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: adminService.getCourses,
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['admin', 'tests', selectedTestId, 'attempts'],
    queryFn: () => adminService.getTestAttempts(selectedTestId!),
    enabled: !!selectedTestId && attemptsDialogOpen,
  });

  // Fetch full test detail for preview
  const { data: viewTestDetail, isLoading: viewTestLoading } = useQuery({
    queryKey: ['admin', 'tests', viewingTestId],
    queryFn: () => adminService.getTestById(viewingTestId!),
    enabled: !!viewingTestId && viewDialogOpen,
  });

  // Fetch full test detail (with questions) when editing
  const { data: editTestDetail, isLoading: editTestLoading } = useQuery({
    queryKey: ['admin', 'tests', editingTest?.id],
    queryFn: () => adminService.getTestById(editingTest!.id),
    enabled: !!editingTest?.id && editDialogOpen,
  });

  // ─── Create form ───────────────────────────────────────────
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema) as Resolver<TestFormValues>,
    defaultValues: {
      title: '',
      description: '',
      course: '',
      durationMinutes: 1,
      questions: [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  // ─── Edit form ─────────────────────────────────────────────
  const editForm = useForm<TestFormValues>({
    resolver: zodResolver(testSchema) as Resolver<TestFormValues>,
    defaultValues: {
      title: '',
      description: '',
      course: '',
      durationMinutes: 1,
      questions: [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }],
    },
  });

  const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({
    control: editForm.control,
    name: 'questions',
  });

  // Populate edit form when test detail loads
  useEffect(() => {
    if (editTestDetail && editDialogOpen) {
      const questions = (editTestDetail.questions || []).map((q) => {
        // Find correct option index from correctAnswer text
        const correctIdx = q.correctAnswer
          ? q.options.indexOf(q.correctAnswer)
          : q.correctOptionIndex ?? 0;
        return {
          question: q.question,
          options: q.options.length === 4 ? q.options : ['', '', '', ''],
          correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
          marks: q.marks ?? 1,
        };
      });

      editForm.reset({
        title: editTestDetail.title,
        description: editTestDetail.description || '',
        course: editTestDetail.course,
        durationMinutes: editTestDetail.durationMinutes,
        questions: questions.length > 0
          ? questions
          : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }],
      });
    }
  }, [editTestDetail, editDialogOpen, editForm]);

  // ─── Mutations ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: adminService.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      toast.success('Test created');
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.createTest>[0] }) =>
      adminService.deleteTest(id).then(() => adminService.createTest(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      toast.success('Test updated');
      setEditDialogOpen(false);
      setEditingTest(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleTestActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      toast.success('Test status updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      toast.success('Test deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ─── Handlers ──────────────────────────────────────────────
  const onSubmit = (data: TestFormValues) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: TestFormValues) => {
    if (!editingTest) return;
    // Delete and recreate to update questions atomically
    updateMutation.mutate({ id: editingTest.id, data });
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setEditDialogOpen(true);
  };

  const handleViewTest = (testId: string) => {
    setViewingTestId(testId);
    setViewDialogOpen(true);
  };

  const handleViewAttempts = (testId: string, testTitle: string) => {
    setSelectedTestId(testId);
    setSelectedTestTitle(testTitle);
    setAttemptsDialogOpen(true);
  };

  const getScoreBadge = (score: number, totalMarks: number) => {
    if (totalMarks === 0) return 'secondary';
    const pct = (score / totalMarks) * 100;
    if (pct >= 60) return 'success';
    if (pct >= 40) return 'warning';
    return 'destructive';
  };

  // ─── Question form fields (shared renderer) ───────────────
  const renderQuestionFields = (
    formInstance: typeof form,
    fieldList: typeof fields,
    appendFn: typeof append,
    removeFn: typeof remove,
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Questions</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendFn({ question: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
        </Button>
      </div>

      {fieldList.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-start justify-between">
              <Label className="font-medium">Question {index + 1}</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Marks:</Label>
                  <Input
                    type="number"
                    {...formInstance.register(`questions.${index}.marks`)}
                    className="h-7 w-16"
                    min={1}
                  />
                </div>
                {fieldList.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFn(index)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <Input {...formInstance.register(`questions.${index}.question`)} placeholder="Enter question" />

            <div className="space-y-2">
              <Label className="text-xs">Options (mark correct answer)</Label>
              <RadioGroup
                value={String(formInstance.watch(`questions.${index}.correctOptionIndex`))}
                onValueChange={(v) => formInstance.setValue(`questions.${index}.correctOptionIndex`, Number(v))}
              >
                {[0, 1, 2, 3].map((optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <RadioGroupItem value={String(optIdx)} id={`${field.id}-opt${optIdx}`} />
                    <Input
                      {...formInstance.register(`questions.${index}.options.${optIdx}`)}
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

  // ─── Test form fields (shared renderer) ────────────────────
  const renderTestFields = (formInstance: typeof form) => (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Title *</Label>
          <Input {...formInstance.register('title')} />
          {formInstance.formState.errors.title && <p className="text-xs text-destructive">{formInstance.formState.errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Course *</Label>
          <Select value={formInstance.watch('course')} onValueChange={(v) => formInstance.setValue('course', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Duration (min) *</Label>
          <Input type="number" {...formInstance.register('durationMinutes')} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea {...formInstance.register('description')} placeholder="Optional test description" rows={2} />
      </div>
    </>
  );

  if (isLoading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Test Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Create and manage assessments for your students</p>
          </div>
          <Button size="lg" onClick={() => setDialogOpen(true)} className="shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Create Test
          </Button>
        </div>

        {!tests || tests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">No tests created yet</p>
                <p className="text-sm text-muted-foreground mt-1">Get started by creating your first test</p>
              </div>
              <Button onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {tests.map((test) => (
              <Card
                key={test.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/50"
                onClick={() => handleViewTest(test.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{test.title}</CardTitle>
                      {test.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{test.description}</p>
                      )}
                    </div>
                    <Badge variant={test.isPublished ? 'success' : 'secondary'} className="shrink-0">
                      {test.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      <BookOpen className="h-3 w-3" />
                      {test.course || '—'}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      <Clock className="h-3 w-3" />
                      {test.durationMinutes} min
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                      <HelpCircle className="h-3 w-3" />
                      {test.questionCount ?? test.questions?.length ?? 0} Q's
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Award className="h-3 w-3" />
                      {test.totalMarks} marks
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(test)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant={test.isPublished ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => toggleMutation.mutate(test.id)}
                      loading={toggleMutation.isPending}
                      className={`gap-1.5 ${!test.isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700' : ''}`}
                    >
                      {!toggleMutation.isPending && <Power className="h-3.5 w-3.5" />}
                      {test.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAttempts(test.id, test.title)}
                      className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                    >
                      <Users className="h-3.5 w-3.5" /> Attempts
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(test.id)}
                      loading={deleteMutation.isPending}
                      className="ml-auto h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {!deleteMutation.isPending && <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Test Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Test</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {renderTestFields(form)}
              <Separator />
              {renderQuestionFields(form, fields, append, remove)}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Test'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Test Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingTest(null);
        }}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Test</DialogTitle>
            </DialogHeader>
            {editTestLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                {renderTestFields(editForm)}
                <Separator />
                {renderQuestionFields(editForm, editFields, editAppend, editRemove)}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setEditingTest(null); }}>Cancel</Button>
                  <Button type="submit" loading={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Test Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setViewingTestId(null);
        }}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                {viewTestDetail?.title ?? 'Test Preview'}
              </DialogTitle>
              {viewTestDetail && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant={viewTestDetail.isPublished ? 'success' : 'secondary'}>
                    {viewTestDetail.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{viewTestDetail.course}</span>
                  <span className="text-sm text-muted-foreground">{viewTestDetail.durationMinutes} min</span>
                  <span className="text-sm text-muted-foreground">{viewTestDetail.totalMarks} marks</span>
                </div>
              )}
            </DialogHeader>
            {viewTestLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !viewTestDetail?.questions?.length ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No questions in this test</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viewTestDetail.questions.map((q, idx) => (
                  <div key={q.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1.5">Q{idx + 1}.</span>
                        {q.question}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-xs">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Badge>
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
                                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800'
                                : 'bg-muted/50'
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

        {/* Attempts Dialog */}
        <Dialog open={attemptsDialogOpen} onOpenChange={setAttemptsDialogOpen}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                Attempts — {selectedTestTitle}
              </DialogTitle>
              {attempts && attempts.length > 0 && (
                <p className="text-sm text-muted-foreground">{attempts.length} total attempt{attempts.length !== 1 ? 's' : ''}</p>
              )}
            </DialogHeader>
            {attemptsLoading ? (
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
                        <TableCell className="font-medium">{attempt.studentName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{attempt.studentEmail}</TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadge(attempt.score, attempt.totalMarks) as "default" | "secondary" | "destructive" | "outline"}>
                            {attempt.score}/{attempt.totalMarks}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            attempt.status === 'submitted' ? 'success' :
                            attempt.status === 'expired' ? 'destructive' : 'warning'
                          }>
                            {attempt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {attempt.submittedAt
                            ? new Date(attempt.submittedAt).toLocaleString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
