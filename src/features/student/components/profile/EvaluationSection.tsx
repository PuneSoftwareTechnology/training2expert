import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Star, CloudUpload, Upload, TrendingUp, MessageCircle, Award, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader, fadeUp } from './shared';
import type { Evaluation } from '@/types/student.types';

interface EvaluationSectionProps {
  evaluations: Evaluation[] | undefined;
}

export default function EvaluationSection({ evaluations }: EvaluationSectionProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);

  const avgTechnical =
    evaluations && evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.technicalScore, 0) / evaluations.length) * 10)
      : 0;
  const avgCommunication =
    evaluations && evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.communicationScore, 0) / evaluations.length) * 10) / 10
      : 0;
  const scopeText = evaluations?.find((e) => e.scopeForImprovement)?.scopeForImprovement ?? '';
  const projectUrl = evaluations?.find((e) => e.projectSubmission)?.projectSubmission;

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
                {avgTechnical}%
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
                      <span className="font-semibold text-violet-600">{evaluation.technicalScore * 10}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${evaluation.technicalScore * 10}%` }}
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

        {/* Project Submission */}
        <Card className="overflow-hidden border border-sky-100 bg-white shadow-lg shadow-sky-500/5 dark:border-sky-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
          <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
            <h3 className="mb-4 font-semibold">Project Submission</h3>
            {projectUrl ? (
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/30"
                >
                  <Upload className="h-8 w-8 text-emerald-600" />
                </motion.div>
                <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                  View Submission
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.05, borderColor: 'rgb(56 189 248 / 0.5)' }}
                  className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-colors"
                  onClick={() => projectInputRef.current?.click()}
                >
                  <CloudUpload className="h-8 w-8 text-muted-foreground/40" />
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground">Upload PDF</p>
                <p className="text-xs text-muted-foreground">Maximum 10MB</p>
                <input ref={projectInputRef} type="file" accept=".pdf" className="hidden" />
              </div>
            )}
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
