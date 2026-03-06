import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare, FileText, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';

export default function EvaluationsPage() {
  const { data: evaluations, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: studentService.getEvaluations,
  });

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
                    Avg: {((evaluation.technicalScore + evaluation.communicationScore) / 2).toFixed(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Technical Score</p>
                      <p className="text-lg font-semibold">{evaluation.technicalScore}/10</p>
                    </div>
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
                {/* trainerRemark is INTENTIONALLY not rendered here */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
