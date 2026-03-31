import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Star, CloudUpload, Upload, TrendingUp, MessageCircle, Award, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';
import { SectionHeader, fadeUp } from './shared';
import type { Evaluation, ProjectSubmission } from '@/types/student.types';

interface EvaluationSectionProps {
  evaluations: Evaluation[] | undefined;
  projectSubmissions: ProjectSubmission[] | undefined;
}

export default function EvaluationSection({ evaluations, projectSubmissions }: EvaluationSectionProps) {
  const queryClient = useQueryClient();
  const projectInputRef = useRef<HTMLInputElement>(null);

  const projectUploadMutation = useMutation({
    mutationFn: studentService.uploadProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Project uploaded successfully');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleProjectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) projectUploadMutation.mutate(file);
  };

  const totalScored = evaluations?.reduce((sum, e) => sum + e.technicalMarksScored, 0) ?? 0;
  const totalPossible = evaluations?.reduce((sum, e) => sum + e.technicalTotalMarks, 0) ?? 0;
  const avgTechnicalPct = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
  const avgCommunication =
    evaluations && evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.communicationScore, 0) / evaluations.length) * 10) / 10
      : 0;
  const scopeText = evaluations?.find((e) => e.scopeForImprovement)?.scopeForImprovement ?? '';
  const hasProjects = projectSubmissions && projectSubmissions.length > 0;

  return (
    <section id="section-evaluation" className="scroll-mt-20">
      <div className="mb-4 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent md:mb-8 dark:via-violet-700/30" />
      <SectionHeader icon={Award} gradient="from-violet-500 to-purple-600" title="Academic Evaluation" subtitle="Performance scores & feedback" />

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Technical Score */}
        <Card className="overflow-hidden border border-violet-100 bg-white shadow-lg shadow-violet-500/5 dark:border-violet-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
          <CardContent className="pt-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Technical Score
              </h3>
              <span className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-lg font-bold text-white shadow-sm">
                {totalScored}/{totalPossible} ({avgTechnicalPct}%)
              </span>
            </div>
            <div className="space-y-3">
              {evaluations && evaluations.length > 0 ? (
                evaluations.map((evaluation, idx) => (
                  <motion.div
                    key={evaluation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{evaluation.courseName}</span>
                      <span className="font-semibold text-violet-600">
                        {evaluation.technicalMarksScored}/{evaluation.technicalTotalMarks}
                        {evaluation.technicalTotalMarks > 0 && ` (${Math.round((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100)}%)`}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${evaluation.technicalTotalMarks > 0 ? (evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100 : 0}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.15, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm italic text-muted-foreground">No evaluations yet</p>
              )}
            </div>
            <p className="mt-4 text-xs italic text-muted-foreground">Objective exams are time-bound. Modules must be completed sequentially.</p>
          </CardContent>
        </Card>

        {/* Communication Score */}
        <Card className="overflow-hidden border border-amber-100 bg-white shadow-lg shadow-amber-500/5 dark:border-amber-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <MessageCircle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="mb-3 font-semibold">Communication Score</h3>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-5xl font-bold"
            >
              {evaluations && evaluations.length > 0 ? `${avgCommunication.toFixed(0)}/10` : '-/10'}
            </motion.p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: star * 0.1, type: 'spring', stiffness: 300 }}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= Math.round(avgCommunication / 2)
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                        : 'text-muted-foreground/20'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Manually updated by Trainer</p>
          </CardContent>
        </Card>

        {/* Project Submissions */}
        <Card className="overflow-hidden border border-sky-100 bg-white shadow-lg shadow-sky-500/5 dark:border-sky-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
          <CardContent className="pt-6">
            <h3 className="mb-4 text-center font-semibold">Project Submissions</h3>

            {/* List of submitted projects */}
            {hasProjects && (
              <div className="mb-4 space-y-2">
                {projectSubmissions.map((project, idx) => (
                  <motion.a
                    key={project.id}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 transition-colors hover:bg-emerald-100/70 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <Upload className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Project {idx + 1}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}

            {/* Upload new project */}
            <div className="flex flex-col items-center space-y-2">
              <motion.div
                whileHover={projectUploadMutation.isPending ? {} : { scale: 1.05, borderColor: 'rgb(56 189 248 / 0.5)' }}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-colors"
                onClick={() => !projectUploadMutation.isPending && projectInputRef.current?.click()}
              >
                <CloudUpload className={`h-6 w-6 ${projectUploadMutation.isPending ? 'animate-pulse text-sky-400' : 'text-muted-foreground/40'}`} />
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">
                {projectUploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}
              </p>
              <p className="text-xs text-muted-foreground">Maximum 10MB</p>
              <input ref={projectInputRef} type="file" accept=".pdf" className="hidden" onChange={handleProjectUpload} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scope for Improvement */}
      {scopeText && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <Card className="overflow-hidden border border-amber-100 bg-white shadow-lg dark:border-amber-900/40 dark:bg-slate-900">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Scope for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-4 dark:from-amber-950/20 dark:to-orange-950/10">
                <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">"{scopeText}"</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </section>
  );
}
