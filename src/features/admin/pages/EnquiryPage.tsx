import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { HtmlCodeEditor } from "@/components/ui/html-code-editor";
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
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import {
  enquirySchema,
  type EnquiryFormValues,
} from "../schemas/enquiry.schema";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate, todayStr } from "@/utils/format";
import {
  INSTITUTES,
  LEAD_STATUSES,
  DEMO_STATUSES,
  ENQUIRY_TYPES,
} from "@/constants/courses";
import type {
  LeadStatus,
  DemoStatus,
  Institute,
  EnquiryType,
} from "@/types/common.types";
import type { Enquiry } from "@/types/admin.types";

const LEAD_BADGE: Record<
  LeadStatus,
  "default" | "destructive" | "success" | "warning"
> = {
  NEW: "warning",
  PROSPECTIVE: "default",
  NON_PROSPECTIVE: "destructive",
  ENROLLED: "success",
};

const DEMO_BADGE: Record<DemoStatus, "success" | "warning"> = {
  DONE: "success",
  PENDING: "warning",
};

const INSTITUTE_BADGE: Record<string, "default" | "secondary"> = {
  TECHVAA: "default",
  TCH: "secondary",
};

const ENQUIRY_TYPE_BADGE: Record<string, "default" | "secondary" | "outline"> =
  {
    WALKIN: "default",
    PHONE: "secondary",
    WEBSITE: "outline",
  };

const FORM_SELECTS = [
  {
    name: "institute" as const,
    label: "Institute",
    options: INSTITUTES.map((i) => ({ value: i, label: i })),
  },
  {
    name: "enquiryType" as const,
    label: "Enquiry Type",
    options: ENQUIRY_TYPES.map((t) => ({ ...t })),
  },
  {
    name: "leadStatus" as const,
    label: "Lead Status",
    options: LEAD_STATUSES.map((s) => ({ ...s })),
  },
  {
    name: "demoStatus" as const,
    label: "Demo Status",
    options: DEMO_STATUSES.map((s) => ({ ...s })),
  },
];

const FILTER_SELECTS = [
  { label: "Lead Status", key: "lead" as const, options: LEAD_STATUSES },
  { label: "Demo Status", key: "demo" as const, options: DEMO_STATUSES },
  {
    label: "Institute",
    key: "institute" as const,
    options: INSTITUTES.map((i) => ({ value: i, label: i })),
  },
  {
    label: "Enquiry Type",
    key: "enquiryType" as const,
    options: ENQUIRY_TYPES.map((t) => ({ ...t })),
  },
];

const DEMO_EMAIL_SUBJECT =
  "Thank You for Attending the Demo Session – Take the Next Step in Your Career";

const DEMO_EMAIL_BODY = `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">Dear Candidate,</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">Thank you for attending our demo session. We hope you found the session informative &amp; practical.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333;">At <strong>Tech Concept Hub</strong>, our focus is not only on teaching concepts but also on helping students gain real industry-oriented practical knowledge, confidence, and job-ready skills.</p>
<div style="background:#f6f3fc;border-left:4px solid #4a1a8a;padding:18px 22px;margin:20px 0;border-radius:0 6px 6px 0;">
  <p style="margin:0 0 12px;font-weight:600;color:#4a1a8a;font-size:15px;">✅ What you will get in the complete course</p>
  <ul style="padding-left:20px;margin:0;color:#333;line-height:1.8;font-size:14px;">
    <li>Practical hands-on training</li>
    <li>Real-time business scenario explanation</li>
    <li>Guidance from experienced industry trainers</li>
    <li>Interview preparation support</li>
    <li>Resume/CV building assistance</li>
    <li>Recorded sessions &amp; practice materials</li>
    <li>Support for projects and assignments</li>
    <li>Certification guidance</li>
    <li>Placement Assistance</li>
  </ul>
</div>
<p style="margin:20px 0 16px;font-size:15px;line-height:1.6;color:#333;">If you would like to enroll or need complete course details such as syllabus, fees, batch timings, or career guidance, simply contact us.</p>
<p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:#333;">Best Regards,<br><strong>Tech Concept Hub Team</strong><br>📞 Contact: <a href="tel:7262000918" style="color:#4a1a8a;text-decoration:none;font-weight:600;">7262000918</a></p>`;

// Wrap text into lines of at most `limit` chars, breaking on word
// boundaries (falls back to a hard break for words longer than the limit).
// Existing line breaks are preserved so each follow-up stays on its own line.
function wrapText(text: string, limit = 100): string {
  return text
    .split(/\r?\n/)
    .map((paragraph) => wrapLine(paragraph, limit))
    .join("\n");
}

function wrapLine(text: string, limit: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/[^\S\n]+/).filter(Boolean)) {
    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= limit) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
    while (line.length > limit) {
      lines.push(line.slice(0, limit));
      line = line.slice(limit);
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function exportEnquiriesCsv(items: Enquiry[]) {
  const headers = [
    "Date",
    "Name",
    "Phone",
    "Email",
    "Course",
    "Institute",
    "Enquiry Type",
    "Lead Status",
    "Demo Status",
    "Demo Date",
    "Comment",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = items.map((e) => {
    const raw = e as unknown as Record<string, string>;
    return [
      e.enquiry_date ? formatDate(e.enquiry_date) : "",
      e.name,
      e.phone,
      e.email ?? "",
      e.course ?? "",
      e.institute,
      ENQUIRY_TYPES.find((t) => t.value === e.enquiry_type)?.label ??
        e.enquiry_type ??
        "",
      LEAD_STATUSES.find((s) => s.value === (raw.lead_status ?? e.leadStatus))
        ?.label ??
        raw.lead_status ??
        e.leadStatus,
      DEMO_STATUSES.find((s) => s.value === (raw.demo_status ?? e.demoStatus))
        ?.label ??
        raw.demo_status ??
        e.demoStatus,
      e.demo_date ? formatDate(e.demo_date) : "",
      e.comment ?? "",
    ]
      .map(escape)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enquiries_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EnquiryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    fromDate: searchParams.get("fromDate") ?? "",
    toDate: searchParams.get("toDate") ?? "",
    lead: searchParams.get("leadStatus") ?? "",
    demo: searchParams.get("demoStatus") ?? "",
    institute: searchParams.get("institute") ?? "",
    course: searchParams.get("course") ?? "",
    enquiryType: searchParams.get("enquiryType") ?? "",
  }));

  useEffect(() => {
    if (Array.from(searchParams.keys()).length > 0) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTargetIds, setEmailTargetIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin", "enquiries", filters],
    queryFn: () =>
      adminService.getEnquiries({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        leadStatus: (filters.lead as LeadStatus) || undefined,
        demoStatus: (filters.demo as DemoStatus) || undefined,
        institute: (filters.institute as Institute) || undefined,
        course: filters.course || undefined,
        enquiryType: (filters.enquiryType as EnquiryType) || undefined,
      }),
  });

  const { data: masterCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "master-courses", "ENQUIRY"],
    queryFn: () => adminService.getMasterCourses(true, "ENQUIRY"),
  });

  const courseOptions = useMemo(
    () => (masterCourses ?? []).map((c) => c.name),
    [masterCourses],
  );

  // Filter options: master list + legacy course names on existing records.
  // Blanks are dropped — Radix throws on a SelectItem with an empty value.
  const courses = useMemo(() => {
    const names = [...courseOptions, ...(data?.courses ?? [])]
      .map((c) => (c ?? "").trim())
      .filter(Boolean);
    return [...new Set(names)].sort();
  }, [courseOptions, data?.courses]);

  // The dropdown is select-only, so an enquiry saved before the master list
  // existed would show blank and lose its course on the next save. Append the
  // record's own value when it is missing rather than adding it to the master
  // list, which stays managed from Course Management.
  const formCourseOptions = useMemo(() => {
    const current = editingEnquiry?.course?.trim();
    return current && !courseOptions.includes(current)
      ? [...courseOptions, current]
      : courseOptions;
  }, [courseOptions, editingEnquiry?.course]);

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      enquiry_date: todayStr(),
      institute: "TECHVAA",
      enquiryType: "WALKIN",
      leadStatus: "NEW",
      demoStatus: "PENDING",
    },
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    refetch();
    setDialogOpen(false);
    setEditingEnquiry(null);
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: (data: EnquiryFormValues) =>
      adminService.createEnquiry(data as Omit<Enquiry, "id">),
    onSuccess: () => {
      invalidateAndClose();
      toast.success("Enquiry created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EnquiryFormValues>;
    }) => adminService.updateEnquiry(id, data as Partial<Enquiry>),
    onSuccess: () => {
      invalidateAndClose();
      toast.success("Enquiry updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      toast.success("Enquiry deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      adminService.sendEnquiryBulkEmail(
        emailTargetIds,
        emailSubject,
        emailBody,
      ),
    onSuccess: (res) => {
      const skippedMsg = res.skipped
        ? ` (${res.skipped} skipped — no email)`
        : "";
      toast.success(`${res.sent} email(s) sent${skippedMsg}`);
      setEmailDialog(false);
      setEmailTargetIds([]);
      setEmailSubject("");
      setEmailBody("");
      setSelectedIds([]);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEmailDialog = (ids: string[]) => {
    setEmailTargetIds(ids);
    setEmailSubject(DEMO_EMAIL_SUBJECT);
    setEmailBody(DEMO_EMAIL_BODY);
    setEmailDialog(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectableIds = useMemo(
    () => (data?.items ?? []).filter((e) => !!e.email).map((e) => e.id),
    [data?.items],
  );

  const toggleAll = () => {
    if (!selectableIds.length) return;
    if (selectedIds.length === selectableIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIds);
    }
  };

  const onSubmit = (values: EnquiryFormValues) => {
    const { enquiry_date, demo_date, comment, ...rest } = values;
    const payload = {
      ...rest,
      enquiryDate: enquiry_date,
      demoDate: demo_date || undefined,
      comment: comment || undefined,
    };
    editingEnquiry
      ? updateMutation.mutate({
          id: editingEnquiry.id,
          data: payload as unknown as Partial<EnquiryFormValues>,
        })
      : createMutation.mutate(payload as unknown as EnquiryFormValues);
  };

  const openEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    const raw = enquiry as unknown as Record<string, string>;
    form.reset({
      enquiry_date: (raw.enquiry_date ?? "").split("T")[0],
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email ?? "",
      course: enquiry.course ?? "",
      institute: enquiry.institute,
      enquiryType: (raw.enquiry_type ??
        enquiry.enquiry_type ??
        "WALKIN") as EnquiryFormValues["enquiryType"],
      leadStatus: (raw.lead_status ??
        enquiry.leadStatus) as EnquiryFormValues["leadStatus"],
      demoStatus: (raw.demo_status ??
        enquiry.demoStatus) as EnquiryFormValues["demoStatus"],
      demo_date: (raw.demo_date ?? enquiry.demo_date ?? "").split("T")[0],
      comment: enquiry.comment ?? "",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingEnquiry(null);
    form.reset({
      enquiry_date: todayStr(),
      institute: "TECHVAA",
      enquiryType: "WALKIN",
      leadStatus: "NEW",
      demoStatus: "PENDING",
    });
    setDialogOpen(true);
  };

  const filteredData = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchText.trim()) return items;
    const term = searchText.toLowerCase();
    return items.filter((e) =>
      [
        e.name,
        e.phone,
        e.email,
        e.course,
        e.institute,
        ENQUIRY_TYPES.find((t) => t.value === e.enquiry_type)?.label,
        e.comment,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [data?.items, searchText]);

  const columns: ColumnDef<Enquiry>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            selectableIds.length > 0 &&
            selectedIds.length === selectableIds.length
          }
          onCheckedChange={toggleAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const e = row.original;
        if (!e.email) return null;
        return (
          <Checkbox
            checked={selectedIds.includes(e.id)}
            onCheckedChange={() => toggleSelect(e.id)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
    },
    {
      id: "sno",
      header: "n.",
      cell: ({ row }) => (
        <span className="font-medium text-center">{row.index + 1}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "enquiry_date",
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? formatDate(v) : "-";
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => getValue<string>() || "-",
    },
    {
      accessorKey: "course",
      header: "Course",
      cell: ({ getValue }) => getValue<string>() || "-",
    },
    {
      accessorKey: "institute",
      header: "Ins.",
      cell: ({ getValue }) => {
        const v = getValue<string>() ?? "-";
        return <Badge variant={INSTITUTE_BADGE[v] ?? "outline"}>{v}</Badge>;
      },
    },
    {
      accessorKey: "enquiry_type",
      header: "Enquiry Type",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        if (!v) return "-";
        const label = ENQUIRY_TYPES.find((t) => t.value === v)?.label ?? v;
        return (
          <Badge variant={ENQUIRY_TYPE_BADGE[v] ?? "outline"}>{label}</Badge>
        );
      },
    },
    {
      accessorKey: "lead_status",
      header: "Lead",
      cell: ({ getValue }) => {
        const v = getValue<LeadStatus>();
        const label = LEAD_STATUSES.find((s) => s.value === v)?.label ?? v;
        return <Badge variant={LEAD_BADGE[v]}>{label}</Badge>;
      },
    },
    {
      accessorKey: "demo_status",
      header: "Demo",
      cell: ({ getValue }) => {
        const v = getValue<DemoStatus>();
        const label = DEMO_STATUSES.find((s) => s.value === v)?.label ?? v;
        return <Badge variant={DEMO_BADGE[v]}>{label}</Badge>;
      },
    },
    {
      accessorKey: "demo_date",
      header: ({ column }) => (
        <SortableHeader column={column} title="Demo Date" />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? formatDate(v) : "-";
      },
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? (
          <span
            className="block min-w-[420px] max-w-[420px] whitespace-pre-wrap break-words"
            title={v}
          >
            {wrapText(v, 200)}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => openEdit(e)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {e.email && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => openEmailDialog([e.id])}
                title="Send email"
              >
                <Mail className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleteId(e.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-md shadow-amber-200/50">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enquiry Management</h2>
              <p className="text-sm text-muted-foreground">
                Track and manage all student enquiries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions
              onReset={() => {
                setFilters({
                  fromDate: "",
                  toDate: "",
                  lead: "",
                  demo: "",
                  institute: "",
                  course: "",
                  enquiryType: "",
                });
                setSearchText("");
                queryClient.invalidateQueries({
                  queryKey: ["admin", "enquiries"],
                });
              }}
              onRefresh={() => refetch()}
              isFetching={isFetching}
              onExport={
                filteredData.length
                  ? () => exportEnquiriesCsv(filteredData)
                  : undefined
              }
            />
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200/50 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="mr-2" /> Add Enquiry
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-amber-200/60 bg-gradient-to-r from-amber-100 to-orange-200">
          <CardContent className="pb-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="self-end pb-1.5 text-sm font-semibold mr-16 whitespace-nowrap">
                Total: {filteredData.length} students
              </span>
              {(["fromDate", "toDate"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">
                    {key === "fromDate" ? "From Date" : "To Date"}
                  </Label>
                  <Input
                    type="date"
                    value={filters[key]}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-40"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Search across columns</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-56 pl-8"
                  />
                </div>
              </div>
              {FILTER_SELECTS.map(({ label, key, options }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={filters[key] || "ALL"}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, [key]: v === "ALL" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {options.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select
                  value={filters.course || "ALL"}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      course: v === "ALL" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk actions bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <span className="text-sm font-semibold text-emerald-800">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => openEmailDialog(selectedIds)}
            >
              <Mail className="mr-1 h-3.5 w-3.5" /> Send Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={9} />
        ) : (
          <Card className="border-amber-200/60 overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredData}
                pageSize={filteredData.length || 1}
                emptyMessage="No enquiries found"
                headerClassName="bg-gradient-to-r from-amber-500 to-orange-600"
              />
            </CardContent>
          </Card>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEnquiry ? "Edit Enquiry" : "Add Enquiry"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" {...form.register("enquiry_date")} />
                </div>
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Phone *</Label>
                  <Input
                    maxLength={10}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /\D/g,
                        "",
                      );
                    }}
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Select
                    value={form.watch("course") || ""}
                    onValueChange={(v) => form.setValue("course", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesLoading ? (
                        <SelectItem value="__loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : formCourseOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          No courses available
                        </SelectItem>
                      ) : (
                        formCourseOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Comment</Label>
                  <Textarea
                    {...form.register("comment")}
                    rows={3}
                    placeholder="Enter comment (press Enter to add a follow-up on a new line)"
                  />
                </div>
                {FORM_SELECTS.map(({ name, label, options }) => (
                  <div key={name} className="space-y-1">
                    <Label>{label}</Label>
                    <Select
                      value={form.watch(name) ?? ""}
                      onValueChange={(v) => {
                        form.setValue(name, v as never);
                        if (
                          name === "demoStatus" &&
                          v === "DONE" &&
                          !form.getValues("demo_date")
                        ) {
                          form.setValue("demo_date", todayStr());
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Demo Date</Label>
                  <Input type="date" {...form.register("demo_date")} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
                  {editingEnquiry
                    ? updateMutation.isPending
                      ? "Updating..."
                      : "Update"
                    : createMutation.isPending
                      ? "Creating..."
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
          <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                Send Email
                {emailTargetIds.length > 1
                  ? ` to ${emailTargetIds.length} enquiries`
                  : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <HtmlCodeEditor
                  value={emailBody}
                  onChange={setEmailBody}
                  placeholder="Write your message..."
                />
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEmailDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => sendEmailMutation.mutate()}
                loading={sendEmailMutation.isPending}
                disabled={!emailSubject.trim() || !emailBody.trim()}
              >
                {sendEmailMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Enquiry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                enquiry record.
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
