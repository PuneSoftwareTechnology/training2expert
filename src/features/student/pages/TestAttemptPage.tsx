import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { StartTestResponse, SubmitTestResponse } from '@/types/student.types';

export default function TestAttemptPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<SubmitTestResponse | null>(null);
  const [testData, setTestData] = useState<StartTestResponse | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  // Start test mutation — called once on mount
  const startMutation = useMutation({
    mutationFn: () => studentService.startTest(testId!),
    onSuccess: (data) => {
      setTestData(data);
    },
    onError: (error) => {
      setStartError(getErrorMessage(error));
    },
  });

  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: ({ attemptId, ans }: { attemptId: string; ans: Record<string, number> }) =>
      studentService.submitTest(attemptId, testId!, ans),
    onSuccess: (data) => {
      setResult(data);
      toast.success('Test submitted successfully!');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Start the test once on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && testId) {
      startedRef.current = true;
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const handleSelect = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const doSubmit = useCallback(() => {
    if (submittedRef.current || !testData) return;
    submittedRef.current = true;
    submitMutation.mutate({ attemptId: testData.attempt.id, ans: answers });
  }, [testData, answers, submitMutation]);

  const handleTimeUp = useCallback(() => {
    toast.warning('Time is up! Auto-submitting your answers.');
    doSubmit();
  }, [doSubmit]);

  // ─── Loading state ─────────────────────────────────────────
  if (startMutation.isPending) {
    return <PageLoader />;
  }

  // ─── Error state ───────────────────────────────────────────
  if (startError) {
    return (
      <PageTransition>
        <Card className="mx-auto max-w-md mt-12">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Cannot Start Test</p>
            <p className="text-sm text-muted-foreground">{startError}</p>
            <Button variant="outline" onClick={() => navigate('/student/tests', { replace: true })}>
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // ─── Result screen ────────────────────────────────────────
  if (result) {
    const pct = result.percentage;
    return (
      <PageTransition>
        <Card className="mx-auto max-w-md mt-12">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Trophy className={`h-16 w-16 ${pct >= 60 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <h2 className="text-2xl font-bold">Test Completed!</h2>
            <div className="space-y-1">
              <p className="text-4xl font-bold">
                {result.score}/{result.totalMarks}
              </p>
              <p className="text-lg text-muted-foreground">{pct}%</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {pct >= 60 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Passed</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Needs Improvement</span>
                </>
              )}
            </div>
            <Button onClick={() => navigate('/student/tests', { replace: true })} className="mt-4">
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // ─── Waiting for data ──────────────────────────────────────
  if (!testData) {
    return <PageLoader />;
  }

  const { test, attempt } = testData;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  // ─── Test taking UI ────────────────────────────────────────
  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Sticky header with timer */}
        <div className="sticky top-14 z-20 flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">{test.title}</h2>
            <p className="text-sm text-muted-foreground">
              {answeredCount}/{totalQuestions} answered
              <span className="ml-2 text-muted-foreground/50">|</span>
              <span className="ml-2">Total: {test.totalMarks} marks</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TestTimer expiryTime={attempt.expiryTime} onTimeUp={handleTimeUp} />
            <Button onClick={() => setShowConfirm(true)} loading={submitMutation.isPending}>
              {!submitMutation.isPending && <Send className="mr-2 h-4 w-4" />}
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
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
            onClick={() => setShowConfirm(true)}
            loading={submitMutation.isPending}
          >
            {!submitMutation.isPending && <Send className="mr-2 h-4 w-4" />}
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
