import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoader } from '@/components/loaders/PageLoader';
import { PageTransition } from '@/components/animations/PageTransition';
import { QuestionCard } from '@/features/tests/components/QuestionCard';
import { TestTimer } from '@/features/tests/components/TestTimer';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';

export default function TestAttemptPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const submittedRef = useRef(false);

  const { data: test, isLoading } = useQuery({
    queryKey: ['student', 'test', testId],
    queryFn: () => studentService.getTestById(testId!),
    enabled: !!testId,
  });

  const submitMutation = useMutation({
    mutationFn: studentService.submitTest,
    onSuccess: (data) => {
      toast.success(`Test submitted! Your score: ${data.score}`);
      navigate('/student/tests', { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSelect = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const doSubmit = useCallback(() => {
    if (submittedRef.current || !testId) return;
    submittedRef.current = true;

    submitMutation.mutate({
      testId,
      answers,
    });
  }, [testId, answers, submitMutation]);

  const handleTimeUp = useCallback(() => {
    toast.warning('Time is up! Auto-submitting your answers.');
    doSubmit();
  }, [doSubmit]);

  const handleManualSubmit = () => {
    setShowConfirm(true);
  };

  if (isLoading || !test) {
    return <PageLoader />;
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Sticky header with timer */}
        <div className="sticky top-14 z-20 flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">{test.title}</h2>
            <p className="text-sm text-muted-foreground">
              {answeredCount}/{totalQuestions} answered
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TestTimer durationMinutes={test.durationMinutes} onTimeUp={handleTimeUp} />
            <Button onClick={handleManualSubmit} disabled={submitMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {test.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              questionNumber={index + 1}
              question={question.question}
              options={question.options}
              selectedOption={answers[question.id]}
              onSelect={(optionIndex) => handleSelect(question.id, optionIndex)}
            />
          ))}
        </div>

        {/* Bottom submit */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleManualSubmit}
            disabled={submitMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>

        {/* Confirm dialog */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Test?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {answeredCount} out of {totalQuestions} questions.
                {answeredCount < totalQuestions && ' Unanswered questions will be marked as incorrect.'}
                {' '}This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Test</AlertDialogCancel>
              <AlertDialogAction onClick={doSubmit}>Submit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
