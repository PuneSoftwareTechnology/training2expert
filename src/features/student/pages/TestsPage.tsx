import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';

export default function TestsPage() {
  const navigate = useNavigate();

  const { data: tests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'tests'],
    queryFn: studentService.getAvailableTests,
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

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available Tests</h2>

        {!tests || tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No tests available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <Badge>{test.course}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{test.durationMinutes} minutes</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{test.questions.length} questions</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/tests/${test.id}`)}
                    >
                      Start Test
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
