import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Mail, MessageSquare, Pencil, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";

export default function CandidateFilterPage() {
  const queryClient = useQueryClient();
  const [course, setCourse] = useState("");
  const [city, setCity] = useState("");
  const [minExp, setMinExp] = useState("");
  const [minTech, setMinTech] = useState("");
  const [minComm, setMinComm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTargetIds, setEmailTargetIds] = useState<string[]>([]);
  const [commentDialog, setCommentDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [comment, setComment] = useState("");
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [editingRemarkValue, setEditingRemarkValue] = useState("");
  const remarkInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "reports",
      "candidates",
      { course, city, minExp, minTech, minComm },
    ],
    queryFn: () =>
      adminService.getCandidateReport({
        course: course || undefined,
        city: city || undefined,
        minExperience: minExp ? Number(minExp) : undefined,
        minTechnicalRating: minTech ? Number(minTech) : undefined,
        minCommunicationRating: minComm ? Number(minComm) : undefined,
      }),
  });

  const downloadBulkMutation = useMutation({
    mutationFn: () => adminService.downloadBulkCvs(selectedIds),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CVs.zip";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CVs downloaded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      adminService.sendBulkEmail(emailTargetIds, emailSubject, emailBody),
    onSuccess: () => {
      toast.success("Email(s) sent");
      setEmailDialog(false);
      setEmailTargetIds([]);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const openEmailDialog = (ids: string[]) => {
    setEmailTargetIds(ids);
    setEmailSubject("Regarding Your Application - PST");
    setEmailBody("");
    setEmailDialog(true);
  };

  const updateRemarkMutation = useMutation({
    mutationFn: ({ enrollmentId, studentId, remark }: { enrollmentId: string; studentId: string; remark: string }) =>
      adminService.updateCandidateRemark(enrollmentId, studentId, remark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports", "candidates"] });
      toast.success("Remark updated");
      setEditingRemarkId(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (editingRemarkId && remarkInputRef.current) {
      remarkInputRef.current.focus();
    }
  }, [editingRemarkId]);

  const addCommentMutation = useMutation({
    mutationFn: () => adminService.addBulkComment(selectedIds, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "reports", "candidates"],
      });
      toast.success("Comment added");
      setCommentDialog(false);
      setComment("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const courses = data?.courses ?? [];
  const cities = data?.cities ?? [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (!data?.items) return;
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((i) => i.id));
    }
  };

  const handleDownloadSingle = async (
    studentId: string,
    name: string,
    course: string,
  ) => {
    try {
      const blob = await adminService.downloadCv(studentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.replace(/\s+/g, "_")}_${course.replace(/\s+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 shadow-md shadow-emerald-200/50">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Candidate Filter Report</h2>
              <p className="text-sm text-muted-foreground">
                Search and filter candidates by skills and ratings
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() => {
              setCourse("");
              setCity("");
              setMinExp("");
              setMinTech("");
              setMinComm("");
            }}
            onRefresh={() => refetch()}
            isFetching={isFetching}
          />
        </div>

        <Card className="border-emerald-200/60 bg-gradient-to-r from-emerald-100 to-green-100">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Experience (yrs)</Label>
                <Input
                  type="number"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Tech Rating</Label>
                <Input
                  type="number"
                  value={minTech}
                  onChange={(e) => setMinTech(e.target.value)}
                  className="w-24"
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Comm Rating</Label>
                <Input
                  type="number"
                  value={minComm}
                  onChange={(e) => setMinComm(e.target.value)}
                  className="w-24"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <span className="text-sm font-semibold text-emerald-800">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => downloadBulkMutation.mutate()}
              loading={downloadBulkMutation.isPending}
            >
              {!downloadBulkMutation.isPending && (
                <Download className="mr-1 h-3.5 w-3.5" />
              )}
              {downloadBulkMutation.isPending
                ? "Downloading..."
                : "Download CVs"}
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => openEmailDialog(selectedIds)}
            >
              <Mail className="mr-1 h-3.5 w-3.5" /> Send Email
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => setCommentDialog(true)}
            >
              <MessageSquare className="mr-1 h-3.5 w-3.5" /> Add Comment
            </Button>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : (
          <Card className="border-emerald-200/60 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-500 to-green-600 border-0 hover:bg-transparent">
                    <TableHead className="w-10 text-white">
                      <Checkbox
                        checked={
                          selectedIds.length === (data?.items?.length ?? 0) &&
                          selectedIds.length > 0
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Course
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      City
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Experience
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Tech
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Comm
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Remarks
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((row) => (
                    <TableRow key={row.enrollmentId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.course}</TableCell>
                      <TableCell>{row.city ?? "-"}</TableCell>
                      <TableCell>{row.itExperienceYears} yrs</TableCell>
                      <TableCell>
                        {(() => {
                          const pct = row.technicalTotalMarks > 0
                            ? Math.round((row.technicalMarksScored / row.technicalTotalMarks) * 100)
                            : 0;
                          const color = pct >= 70
                            ? "border-green-200 bg-green-50 text-green-700"
                            : pct >= 40
                              ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                              : "border-red-200 bg-red-50 text-red-700";
                          return (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
                              {row.technicalMarksScored}/{row.technicalTotalMarks}
                              {row.technicalTotalMarks > 0 && ` (${pct}%)`}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const score = Number(row.communicationScore);
                          const color = score >= 7
                            ? "border-green-200 bg-green-50 text-green-700"
                            : score >= 4
                              ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                              : "border-red-200 bg-red-50 text-red-700";
                          return (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
                              {row.communicationScore}/10
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {editingRemarkId === row.enrollmentId ? (
                          <div className="flex items-center gap-1">
                            <Input
                              ref={remarkInputRef}
                              value={editingRemarkValue}
                              onChange={(e) => setEditingRemarkValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateRemarkMutation.mutate({
                                    enrollmentId: row.enrollmentId,
                                    studentId: row.id,
                                    remark: editingRemarkValue,
                                  });
                                } else if (e.key === "Escape") {
                                  setEditingRemarkId(null);
                                }
                              }}
                              className="h-7 text-sm"
                              disabled={updateRemarkMutation.isPending}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                updateRemarkMutation.mutate({
                                  enrollmentId: row.enrollmentId,
                                  studentId: row.id,
                                  remark: editingRemarkValue,
                                })
                              }
                              disabled={updateRemarkMutation.isPending}
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingRemarkId(null)}
                              disabled={updateRemarkMutation.isPending}
                            >
                              <X className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="group flex cursor-pointer items-center gap-1 truncate text-sm"
                            onClick={() => {
                              setEditingRemarkId(row.enrollmentId);
                              setEditingRemarkValue(row.remarks ?? "");
                            }}
                            title="Click to edit"
                          >
                            <span className="truncate">{row.remarks || "-"}</span>
                            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {row.cvUrl && (
                            <button
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                              onClick={() =>
                                handleDownloadSingle(
                                  row.id,
                                  row.name,
                                  row.course,
                                )
                              }
                            >
                              <Download className="h-3 w-3" /> Download CV
                            </button>
                          )}
                          <button
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            onClick={() => openEmailDialog([row.id])}
                          >
                            <Mail className="h-3 w-3" /> Send Email
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No candidates found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Email Dialog */}
        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send Email{emailTargetIds.length > 1 ? ` to ${emailTargetIds.length} candidates` : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => sendEmailMutation.mutate()}
                  loading={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={commentDialog} onOpenChange={setCommentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment to Selected</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Enter comment..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCommentDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => addCommentMutation.mutate()}
                  loading={addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
