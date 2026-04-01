import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CloudUpload, Eye, FolderUp, Download, FileDown } from 'lucide-react';
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
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('CV uploaded successfully');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) cvUploadMutation.mutate(file);
  };

  const handleDownloadTemplate = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <section id="section-cv" className="scroll-mt-20">
      <div className="mb-4 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent md:mb-6 dark:via-orange-700/30" />
      <SectionHeader icon={FolderUp} gradient="from-orange-500 to-rose-600" title="Career & Resume" subtitle="Templates & CV upload" />

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_320px]">
        {/* Templates */}
        <Card className="overflow-hidden border border-orange-100 bg-white shadow-lg dark:border-orange-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-rose-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg font-semibold">Resume Templates</CardTitle>
              </div>
              <Badge className="rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-xs text-white shadow-sm">Required</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Download a template, fill in your details, and upload your completed resume below</p>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="space-y-2.5">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ x: 2 }}
                    className="group flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 transition-colors hover:border-orange-200 hover:bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                        <FileDown className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{template.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${
                              template.experienceLevel === 'FRESHER'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}
                          >
                            {template.experienceLevel === 'FRESHER' ? 'Fresher' : 'Experienced'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">.docx</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/40"
                      onClick={() => handleDownloadTemplate(template.downloadUrl, template.originalFilename || `${template.title}.docx`)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </motion.div>
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
            <CardContent className="flex flex-col items-center justify-center gap-3 py-6 sm:gap-4 sm:py-10">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm sm:h-16 sm:w-16"
              >
                <CloudUpload className="h-6 w-6 sm:h-8 sm:w-8" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-bold sm:text-xl">Upload Your CV</h3>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  Once uploaded, our recruitment team will review your profile for placement opportunities.
                </p>
              </div>
              {myCv?.url && (
                <a href={myCv.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                  <Eye className="h-4 w-4" />
                  View Current CV
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
                  <CloudUpload className="mr-1.5 h-4 w-4" />
                  {cvUploadMutation.isPending ? 'Uploading...' : 'Upload Resume File'}
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
