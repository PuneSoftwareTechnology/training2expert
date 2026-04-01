import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Star, CloudUpload, Upload, TrendingUp, MessageCircle, Award, Sparkles,
  CheckCircle2, XCircle, BookOpen,
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
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:gap-5 md:grid-cols-2">

        {/* Technical Score */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Header with circular progress */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 dark:border-slate-800">
            {/* Circular Progress */}
            <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16">
              <svg className="h-12 w-12 sm:h-16 sm:w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-800" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none" strokeWidth="5" strokeLinecap="round"
                  className="text-violet-500"
                  stroke="currentColor"
                  strokeDasharray={2 * Math.PI * 28}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - avgTechnicalPct / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{avgTechnicalPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-semibold">Technical Score</h3>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Overall: <span className="font-semibold text-foreground">{totalScored}</span> / {totalPossible} marks
              </p>
            </div>
          </div>

          {/* Course-wise breakdown */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {evaluations && evaluations.length > 0 ? (
              evaluations.map((evaluation, idx) => {
                const coursePct = evaluation.technicalTotalMarks > 0
                  ? Math.round((evaluation.technicalMarksScored / evaluation.technicalTotalMarks) * 100)
                  : 0;
                return (
                  <motion.div
                    key={evaluation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="px-4 py-3 sm:px-5 sm:py-4"
                  >
                    {/* Course name + accumulated */}
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-sm font-semibold text-foreground">{evaluation.courseName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                          {evaluation.technicalMarksScored}/{evaluation.technicalTotalMarks}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          coursePct >= 50
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {coursePct}%
                        </span>
                      </div>
                    </div>

                    {/* Test scores table */}
                    {evaluation.testScores && evaluation.testScores.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Test</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Score</th>
                              <th className="w-16 px-3 py-2 text-right font-medium text-muted-foreground">%</th>
                              <th className="w-8 px-2 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {evaluation.testScores.map((test, tIdx) => {
                              const pct = test.totalMarks > 0 ? Math.round((test.score / test.totalMarks) * 100) : 0;
                              const passed = pct >= 50;
                              return (
                                <motion.tr
                                  key={test.testId}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.1 + tIdx * 0.05 }}
                                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                >
                                  <td className="px-3 py-2 font-medium text-foreground">{test.testName}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                    <span className="font-semibold text-foreground">{test.score}</span>/{test.totalMarks}
                                  </td>
                                  <td className={`px-3 py-2 text-right tabular-nums font-semibold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {pct}%
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    {passed
                                      ? <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-500" />
                                      : <XCircle className="inline h-3.5 w-3.5 text-red-400" />}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                          {/* Accumulated footer */}
                          <tfoot>
                            <tr className="border-t border-slate-200 bg-violet-50/50 dark:border-slate-700 dark:bg-violet-900/10">
                              <td className="px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300">Accumulated</td>
                              <td className="px-3 py-2 text-right tabular-nums text-xs font-bold text-violet-700 dark:text-violet-300">
                                {evaluation.technicalMarksScored}/{evaluation.technicalTotalMarks}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-xs font-bold text-violet-700 dark:text-violet-300">
                                {coursePct}%
                              </td>
                              <td className="px-2 py-2" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* No tests fallback */}
                    {(!evaluation.testScores || evaluation.testScores.length === 0) && (
                      <p className="text-center text-xs text-muted-foreground">No tests attempted yet</p>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-1 py-8">
                <TrendingUp className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No evaluations yet</p>
              </div>
            )}
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
          <div className="flex flex-col items-center justify-center p-4 text-center sm:p-6">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-4xl font-bold text-foreground sm:text-5xl"
            >
              {evaluations && evaluations.length > 0 ? avgCommunication.toFixed(0) : '-'}
              <span className="text-base font-medium text-muted-foreground sm:text-lg">/10</span>
            </motion.p>
            <div className="mt-3 flex gap-1 sm:mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: star * 0.1, type: 'spring', stiffness: 300 }}
                >
                  <Star
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      star <= Math.round(avgCommunication / 2)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground sm:mt-3 sm:text-xs">Manually updated by Trainer</p>
          </div>
        </div>
      </motion.div>

      {/* Project Submissions */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5} className="mb-4 sm:mb-5">
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

          <div className="p-3 sm:p-5">
            {hasProjects ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-6 sm:py-10 dark:border-slate-700">
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
            <div className="p-3 sm:p-5">
              <div className="rounded-xl bg-amber-50/60 p-3 sm:p-4 dark:bg-amber-950/10">
                <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">"{scopeText}"</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
