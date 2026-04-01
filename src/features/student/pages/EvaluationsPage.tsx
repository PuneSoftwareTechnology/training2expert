import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare, FileText, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';

export default function EvaluationsPage() {
  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentService.getProfile,
  });

  const evaluations = profile?.evaluations;

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

  if (!evaluations || evaluations.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Evaluations</h2>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No evaluations yet</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Evaluations</h2>

        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{evaluation.courseName}</CardTitle>
                  <Badge variant="secondary">
                    {evaluation.technicalTotalMarks > 0
                      ? `${Math.round((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100)}%`
                      : 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Technical Score (Accumulated)</p>
                        <p className="text-lg font-semibold">
                          {evaluation.technicalMarksScored}/{evaluation.technicalTotalMarks}
                          {evaluation.technicalTotalMarks > 0 && (
                            <span className="ml-1 text-sm text-muted-foreground">
                              ({Math.round((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100)}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Individual Test Scores */}
                    {evaluation.testScores && evaluation.testScores.length > 0 && (
                      <div className="ml-11 space-y-1.5 border-l-2 border-primary/20 pl-3">
                        {evaluation.testScores.map((test) => (
                          <div key={test.testId} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{test.testName}</span>
                            <span className="font-medium">
                              {test.score}/{test.totalMarks}
                              {test.totalMarks > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({Math.round((test.score / test.totalMarks) * 100)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Communication Score</p>
                      <p className="text-lg font-semibold">{evaluation.communicationScore}/10</p>
                    </div>
                  </div>

                  {evaluation.projectSubmission && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Project Submission</p>
                        <a
                          href={evaluation.projectSubmission}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Submission
                        </a>
                      </div>
                    </div>
                  )}

                  {evaluation.scopeForImprovement && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Scope for Improvement</p>
                        <p className="text-sm">{evaluation.scopeForImprovement}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
