import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';

export default function CvPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates, isLoading: templatesLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'cv-templates'],
    queryFn: studentService.getCvTemplates,
  });

  const { data: myCv, isLoading: cvLoading } = useQuery({
    queryKey: ['student', 'my-cv'],
    queryFn: studentService.getMyCv,
  });

  const uploadMutation = useMutation({
    mutationFn: studentService.uploadCv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'my-cv'] });
      toast.success('CV uploaded successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleDownloadTemplate = (url: string, course: string, level: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course}_${level}_Template`;
    link.click();
  };

  if (templatesLoading || cvLoading) {
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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">CV Management</h2>

        {/* Download Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Download Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{template.course}</p>
                        <Badge variant="outline" className="text-xs">
                          {template.experienceLevel === 'FRESHER' ? 'Fresher' : 'Experienced'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDownloadTemplate(
                          template.downloadUrl,
                          template.course,
                          template.experienceLevel,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No templates available</p>
            )}
          </CardContent>
        </Card>

        {/* Upload CV */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Your CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCv?.url && (
              <div className="flex items-center gap-3 rounded-lg border bg-green-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">CV uploaded</p>
                  <a
                    href={myCv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View current CV
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload your CV (.pdf, .doc, .docx)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
