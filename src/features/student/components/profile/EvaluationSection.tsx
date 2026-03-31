import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Star, CloudUpload, Upload, TrendingUp, MessageCircle, Award, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
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
      <SectionHeader icon={Award} gradient="from-violet-500 to-purple-600" title="Academic Evaluation" subtitle="Performance scores & feedback" />

      {/* Score Cards Row */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Technical Score */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold">Technical Score</h3>
            </div>
            <div className="rounded-full bg-violet-50 px-3 py-1 dark:bg-violet-900/20">
              <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{totalScored}/{totalPossible}</span>
              <span className="ml-1 text-xs text-violet-500">({avgTechnicalPct}%)</span>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {evaluations && evaluations.length > 0 ? (
              evaluations.map((evaluation, idx) => (
                <motion.div
                  key={evaluation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{evaluation.courseName}</span>
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                      {evaluation.technicalMarksScored}/{evaluation.technicalTotalMarks}
                      {evaluation.technicalTotalMarks > 0 && ` (${Math.round((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100)}%)`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${evaluation.technicalTotalMarks > 0 ? (evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.15, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No evaluations yet</p>
            )}
            <p className="pt-1 text-[11px] text-muted-foreground">Objective exams are time-bound. Modules must be completed sequentially.</p>
          </div>
        </div>

        {/* Communication Score */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <MessageCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold">Communication Score</h3>
          </div>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-5xl font-bold text-foreground"
            >
              {evaluations && evaluations.length > 0 ? avgCommunication.toFixed(0) : '-'}
              <span className="text-lg font-medium text-muted-foreground">/10</span>
            </motion.p>
            <div className="mt-4 flex gap-1">
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
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Manually updated by Trainer</p>
          </div>
        </div>
      </motion.div>

      {/* Project Submissions */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5} className="mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold">Project Submissions</h3>
            </div>
            <button
              type="button"
              onClick={() => !projectUploadMutation.isPending && projectInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/40"
            >
              <CloudUpload className={`h-3.5 w-3.5 ${projectUploadMutation.isPending ? 'animate-pulse' : ''}`} />
              {projectUploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}
            </button>
            <input ref={projectInputRef} type="file" accept=".pdf" className="hidden" onChange={handleProjectUpload} />
          </div>

          <div className="p-5">
            {hasProjects ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectSubmissions.map((project, idx) => (
                  <motion.a
                    key={project.id}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-150 bg-slate-50 px-4 py-3 transition-all hover:border-sky-200 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-sky-800 dark:hover:bg-sky-900/20"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Project {idx + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 dark:border-slate-700">
                <CloudUpload className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No projects submitted yet</p>
                <p className="text-xs text-muted-foreground">Upload a PDF (max 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scope for Improvement */}
      {scopeText && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold">Scope for Improvement</h3>
            </div>
            <div className="p-5">
              <div className="rounded-xl bg-amber-50/60 p-4 dark:bg-amber-950/10">
                <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">"{scopeText}"</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
