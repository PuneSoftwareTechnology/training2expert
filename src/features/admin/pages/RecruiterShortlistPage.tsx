import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  Download,
  FileDown,
  ListChecks,
  Mail,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProfileDialog } from "../components/ProfileDialog";

import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/format";
import type { RecruiterShortlist } from "@/types/admin.types";

function exportShortlistCsv(items: RecruiterShortlist[]) {
  const headers = [
    "S.No",
    "Recruiter",
    "Company",
    "Course",
    "Student Name",
    "Date Shortlisted",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = items.map((r, i) =>
    [
      i + 1,
      r.recruiterName,
      r.companyName || "",
      r.course,
      r.studentName,
      r.dateOfShortlist ? formatDate(r.dateOfShortlist) : "",
    ]
      .map(escape)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recruiter_shortlist_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecruiterShortlistPage() {
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Email dialog state
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTargetIds, setEmailTargetIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Profile dialog state
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "recruiter-shortlist",
      { recruiter: recruiterFilter, course: courseFilter, year: yearFilter },
    ],
    queryFn: () =>
      adminService.getRecruiterShortlist({
        recruiter: recruiterFilter && recruiterFilter !== "ALL" ? recruiterFilter : undefined,
        course: courseFilter && courseFilter !== "ALL" ? courseFilter : undefined,
        year: yearFilter && yearFilter !== "ALL" ? yearFilter : undefined,
      }),
  });

  const items = data?.items ?? [];
  const recruiters = data?.recruiters ?? [];
  const courses = data?.courses ?? [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (row) =>
        row.recruiterName.toLowerCase().includes(q) ||
        row.companyName?.toLowerCase().includes(q) ||
        row.course.toLowerCase().includes(q) ||
        row.studentName.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // Generate year options from data
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    items.forEach((item) => {
      if (item.dateOfShortlist) {
        years.add(new Date(item.dateOfShortlist).getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [items]);

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
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const downloadCvMutation = useMutation({
    mutationFn: (studentId: string) => adminService.downloadCv(studentId),
    onSuccess: (blob, studentId) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${studentId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CV downloaded");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const downloadBulkCvMutation = useMutation({
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
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEmailDialog = (ids: string[]) => {
    setEmailTargetIds(ids);
    setEmailSubject("Regarding Your Application - PST");
    setEmailBody("");
    setEmailDialog(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (!filteredItems.length) return;
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.studentId));
    }
  };

  const resetFilters = () => {
    setRecruiterFilter("");
    setCourseFilter("");
    setYearFilter("");
    setSearchQuery("");
    setSelectedIds([]);
  };

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Sticky upper section */}
        <div className="sticky top-0 z-10 space-y-4 bg-background pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 shadow-md shadow-purple-200/50">
                <ListChecks className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Recruiter Shortlist
                </h2>
                <p className="text-sm text-muted-foreground">
                  Students shortlisted by recruiters
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <Badge variant="outline">
                  {data?.total ?? items.length} record
                  {(data?.total ?? items.length) !== 1 ? "s" : ""}
                </Badge>
              )}
              <FilterActions
                onReset={resetFilters}
                onRefresh={() => refetch()}
                isFetching={isFetching}
              />
            </div>
          </div>

          {/* Filter bar */}
          <Card className="border-purple-200/60 bg-gradient-to-r from-purple-100 to-violet-100">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Recruiter</Label>
                  <Select
                    value={recruiterFilter}
                    onValueChange={setRecruiterFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {recruiters.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Course</Label>
                  <Select
                    value={courseFilter}
                    onValueChange={setCourseFilter}
                  >
                    <SelectTrigger className="w-40">
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
                  <Label className="text-xs">Year</Label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search + Export bar */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search across columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportShortlistCsv(filteredItems)}
              >
                <FileDown className="mr-1 h-3.5 w-3.5" /> Export Data
              </Button>
            )}
          </div>

          {/* Bulk actions bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50/50 p-3">
              <span className="text-sm font-semibold text-purple-800">
                {selectedIds.length} selected
              </span>
              <Button
                size="sm"
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => downloadBulkCvMutation.mutate()}
                loading={downloadBulkCvMutation.isPending}
              >
                {!downloadBulkCvMutation.isPending && (
                  <Download className="mr-1 h-3.5 w-3.5" />
                )}
                {downloadBulkCvMutation.isPending
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
            </div>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No shortlist records</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Card className="border-purple-200/60 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-0 bg-gradient-to-r from-purple-500 to-violet-600 hover:bg-transparent">
                        <TableHead className="w-10 text-white">
                          <Checkbox
                            checked={
                              selectedIds.length === filteredItems.length &&
                              selectedIds.length > 0
                            }
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead className="w-12 text-xs font-semibold uppercase tracking-wider text-white">
                          S.No
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Recruiter
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Company
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Course
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Student Name
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-white">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.studentId)}
                              onCheckedChange={() =>
                                toggleSelect(item.studentId)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.recruiterName}
                          </TableCell>
                          <TableCell>{item.companyName || "-"}</TableCell>
                          <TableCell>{item.course}</TableCell>
                          <TableCell className="font-medium">
                            {item.studentName}
                          </TableCell>
                          <TableCell>
                            {formatDate(item.dateOfShortlist)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <button
                                className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                                onClick={() =>
                                  setProfileStudentId(item.studentId)
                                }
                                title="View Profile"
                              >
                                <User className="h-3 w-3" /> Profile
                              </button>
                              <button
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                onClick={() =>
                                  downloadCvMutation.mutate(item.studentId)
                                }
                                title="Download CV"
                              >
                                <Download className="h-3 w-3" /> CV
                              </button>
                              <button
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                onClick={() =>
                                  openEmailDialog([item.studentId])
                                }
                              >
                                <Mail className="h-3 w-3" /> Email
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedIds.includes(item.studentId)}
                            onCheckedChange={() =>
                              toggleSelect(item.studentId)
                            }
                          />
                          <p className="truncate font-semibold">
                            {item.studentName}
                          </p>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />{" "}
                            {item.recruiterName}
                          </span>
                          {item.companyName && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />{" "}
                              {item.companyName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {item.course}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />{" "}
                          {formatDate(item.dateOfShortlist)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700"
                            onClick={() =>
                              setProfileStudentId(item.studentId)
                            }
                          >
                            <User className="h-3 w-3" /> Profile
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            onClick={() =>
                              downloadCvMutation.mutate(item.studentId)
                            }
                          >
                            <Download className="h-3 w-3" /> CV
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                            onClick={() =>
                              openEmailDialog([item.studentId])
                            }
                          >
                            <Mail className="h-3 w-3" /> Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Email Dialog */}
        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send Email
                {emailTargetIds.length > 1
                  ? ` to ${emailTargetIds.length} students`
                  : ""}
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
                <Button
                  variant="outline"
                  onClick={() => setEmailDialog(false)}
                >
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

        {/* Profile Dialog */}
        <ProfileDialog
          studentId={profileStudentId || ""}
          open={!!profileStudentId}
          onOpenChange={(open) => {
            if (!open) setProfileStudentId(null);
          }}
        />
      </div>
    </PageTransition>
  );
}
