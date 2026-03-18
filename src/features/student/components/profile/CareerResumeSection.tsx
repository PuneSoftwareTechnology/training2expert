import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CloudUpload, FolderUp } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';
import { SectionHeader, fadeUp } from './shared';
import type { CvTemplate } from '@/types/student.types';

interface CareerResumeSectionProps {
  templates: CvTemplate[] | undefined;
  myCv: { url: string } | undefined;
}

export default function CareerResumeSection({ templates, myCv }: CareerResumeSectionProps) {
  const queryClient = useQueryClient();
  const cvInputRef = useRef<HTMLInputElement>(null);

  const cvUploadMutation = useMutation({
    mutationFn: studentService.uploadCv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'my-cv'] });
      toast.success('CV uploaded successfully');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) cvUploadMutation.mutate(file);
  };

  const handleDownloadTemplate = (url: string, course: string, level: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course}_${level}_Template`;
    link.click();
  };

  const templatesByCourse =
    templates?.reduce(
      (acc, t) => {
        if (!acc[t.course]) acc[t.course] = [];
        acc[t.course].push(t);
        return acc;
      },
      {} as Record<string, CvTemplate[]>,
    ) ?? {};

  return (
    <section id="section-cv" className="scroll-mt-20">
      <div className="mb-8 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent dark:via-orange-700/30" />
      <SectionHeader icon={FolderUp} gradient="from-orange-500 to-rose-600" title="Career & Resume" subtitle="Templates & CV upload" />

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Templates */}
        <Card className="overflow-hidden border border-orange-100 bg-white shadow-lg dark:border-orange-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-rose-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Download Templates</CardTitle>
              <Badge className="rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-xs text-white shadow-sm">Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(templatesByCourse).length > 0 ? (
              <div className="divide-y divide-border/50">
                {Object.entries(templatesByCourse).map(([course, courseTemplates]) => (
                  <div key={course} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{course}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.includes('SAP') ? 'Finance & Controlling Professional Template'
                          : course.includes('Data') ? 'Business Intelligence & Viz Template'
                          : course.includes('Cyber') ? 'Security Analyst & Pentesting Template'
                          : 'Professional Template'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {courseTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => handleDownloadTemplate(template.downloadUrl, template.course, template.experienceLevel)}
                        >
                          {template.experienceLevel === 'FRESHER' ? 'Fresher' : 'Experienced'}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No templates available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Upload CV */}
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="overflow-hidden border border-violet-500/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/30">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
              >
                <CloudUpload className="h-8 w-8" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Upload Your CV</h3>
                <p className="mt-1 text-sm text-white/70">
                  Once uploaded, our recruitment team will review your profile for placement opportunities.
                </p>
              </div>
              {myCv?.url && (
                <a href={myCv.url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white/80 hover:text-white">
                  View current CV
                </a>
              )}
              <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white px-6 font-semibold text-violet-700 shadow-lg hover:bg-white/90"
                  onClick={() => cvInputRef.current?.click()}
                  loading={cvUploadMutation.isPending}
                >
                  {cvUploadMutation.isPending ? 'Uploading...' : 'Select Resume File'}
                </Button>
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">PDF format only</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}
