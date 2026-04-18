import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2, FileText, Download, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
// CvTemplate type is used via adminService responses

const TEMPLATE_QUERY_KEY = ["admin", "resume-templates"];

export default function ResumeTemplatesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: templates,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: TEMPLATE_QUERY_KEY,
    queryFn: adminService.getResumeTemplates,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: adminService.getCourses,
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteResumeTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEY });
      toast.success("Template deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 p-2.5 shadow-md shadow-orange-200/50">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Resume Templates</h2>
              <p className="text-sm text-muted-foreground">
                Manage downloadable resume templates for students
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md shadow-orange-200/50 hover:from-orange-600 hover:to-rose-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : (
          <Card className="overflow-hidden border-orange-200/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 bg-gradient-to-r from-orange-500 to-rose-600 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">Title</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">Course</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">Level</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">File</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">View</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-white">Uploaded</TableHead>
                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!templates?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10" />
                          <p>No templates uploaded yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.title}</TableCell>
                        <TableCell>{template.course}</TableCell>
                        <TableCell>
                          <Badge
                            variant={template.experienceLevel === "FRESHER" ? "default" : "secondary"}
                            className={
                              template.experienceLevel === "FRESHER"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {template.experienceLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {template.originalFilename}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            asChild
                          >
                            <a href={template.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(template.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              asChild
                            >
                              <a href={template.downloadUrl} download={template.originalFilename}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteId(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <UploadTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          courses={courses}
          queryKey={TEMPLATE_QUERY_KEY}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The template file will be permanently removed and students will no longer be able to download it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}

function UploadTemplateDialog({
  open,
  onOpenChange,
  courses,
  queryKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: string[];
  queryKey: string[];
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"FRESHER" | "EXPERIENCED" | "">("");
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: adminService.uploadResumeTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Template uploaded successfully");
      resetAndClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetAndClose = () => {
    setTitle("");
    setCourse("");
    setExperienceLevel("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !course || !experienceLevel || !file) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("course", course);
    formData.append("experienceLevel", experienceLevel);
    formData.append("file", file);

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Upload Resume Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. SAP FICO Fresher Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as "FRESHER" | "EXPERIENCED")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRESHER">Fresher</SelectItem>
                  <SelectItem value="EXPERIENCED">Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template File (.docx)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !title.trim() || !course || !experienceLevel || !file}
            className="bg-gradient-to-r from-orange-500 to-rose-600 text-white hover:from-orange-600 hover:to-rose-700"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
