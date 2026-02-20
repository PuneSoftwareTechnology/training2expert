import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Power, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { COURSES } from '@/constants/courses';

const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correctOptionIndex: z.coerce.number().min(0).max(3),
});

const testSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  course: z.string().min(1, 'Course is required'),
  durationMinutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  questions: z.array(questionSchema).min(1, 'At least one question required'),
});

type TestFormValues = z.infer<typeof testSchema>;

export default function TestManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['admin', 'tests'],
    queryFn: adminService.getTests,
  });

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema) as Resolver<TestFormValues>,
    defaultValues: {
      questions: [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const createMutation = useMutation({
    mutationFn: adminService.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      toast.success('Test created');
      setDialogOpen(false);
      form.reset({ questions: [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }] });
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

  const onSubmit = (data: TestFormValues) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Test Management</h2>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Test
          </Button>
        </div>

        {!tests || tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No tests created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <Badge variant={test.isActive ? 'default' : 'secondary'}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
                    <span>Course: {test.course}</span>
                    <span>{test.durationMinutes} min</span>
                    <span>{test.questions.length} questions</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate(test.id)}
                    >
                      <Power className="mr-1 h-3.5 w-3.5" />
                      {test.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(test.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Test</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input {...form.register('title')} />
                  {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Course *</Label>
                  <Select value={form.watch('course')} onValueChange={(v) => form.setValue('course', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Duration (min) *</Label>
                  <Input type="number" {...form.register('durationMinutes')} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between">
                        <Label className="font-medium">Question {index + 1}</Label>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <Input {...form.register(`questions.${index}.question`)} placeholder="Enter question" />

                      <div className="space-y-2">
                        <Label className="text-xs">Options (mark correct answer)</Label>
                        <RadioGroup
                          value={String(form.watch(`questions.${index}.correctOptionIndex`))}
                          onValueChange={(v) => form.setValue(`questions.${index}.correctOptionIndex`, Number(v))}
                        >
                          {[0, 1, 2, 3].map((optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <RadioGroupItem value={String(optIdx)} id={`q${index}-opt${optIdx}`} />
                              <Input
                                {...form.register(`questions.${index}.options.${optIdx}`)}
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Test'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
