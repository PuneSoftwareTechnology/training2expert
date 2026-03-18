import { useQuery } from '@tanstack/react-query';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';

import ProfileDetailsSection from '../components/profile/ProfileDetailsSection';
import PaymentSection from '../components/profile/PaymentSection';
import EvaluationSection from '../components/profile/EvaluationSection';
import CareerResumeSection from '../components/profile/CareerResumeSection';

export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentService.getProfile,
  });
  const { data: paymentData } = useQuery({
    queryKey: ['student', 'payments'],
    queryFn: studentService.getPaymentSummary,
  });
  const { data: evaluations } = useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: studentService.getEvaluations,
  });
  const { data: templates } = useQuery({
    queryKey: ['student', 'cv-templates'],
    queryFn: studentService.getCvTemplates,
  });
  const { data: myCv } = useQuery({
    queryKey: ['student', 'my-cv'],
    queryFn: studentService.getMyCv,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }
  if (isError) return <QueryError error={error} onRetry={refetch} />;
  if (!profile) return null;

  return (
    <PageTransition>
      <div className="space-y-12 pb-8">
        <ProfileDetailsSection profile={profile} />
        <PaymentSection paymentData={paymentData} />
        <EvaluationSection evaluations={evaluations} />
        <CareerResumeSection templates={templates} myCv={myCv ?? undefined} />
      </div>
    </PageTransition>
  );
}
