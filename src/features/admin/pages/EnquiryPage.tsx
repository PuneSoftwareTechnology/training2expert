import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import {
  enquirySchema,
  type EnquiryFormValues,
} from "../schemas/enquiry.schema";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate, todayStr } from "@/utils/format";
import { INSTITUTES, LEAD_STATUSES, DEMO_STATUSES } from "@/constants/courses";
import type { LeadStatus, DemoStatus } from "@/types/common.types";
import type { Enquiry } from "@/types/admin.types";

const LEAD_BADGE: Record<LeadStatus, "default" | "destructive" | "success"> = {
  PROSPECTIVE: "default",
  NON_PROSPECTIVE: "destructive",
  ENROLLED: "success",
};

const DEMO_BADGE: Record<DemoStatus, "success" | "warning"> = {
  DONE: "success",
  PENDING: "warning",
};

const INSTITUTE_BADGE: Record<string, "default" | "secondary"> = {
  PST: "default",
  TCH: "secondary",
};

const FORM_SELECTS = [
  {
    name: "institute" as const,
    label: "Institute",
    options: INSTITUTES.map((i) => ({ value: i, label: i })),
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
];

export default function EnquiryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    lead: "",
    demo: "",
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin", "enquiries", filters],
    queryFn: () =>
      adminService.getEnquiries({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        leadStatus: (filters.lead as LeadStatus) || undefined,
        demoStatus: (filters.demo as DemoStatus) || undefined,
      }),
  });

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      enquiry_date: todayStr(),
      institute: "PST",
      leadStatus: "PROSPECTIVE",
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

  const onSubmit = (data: EnquiryFormValues) => {
    editingEnquiry
      ? updateMutation.mutate({ id: editingEnquiry.id, data })
      : createMutation.mutate(data);
  };

  const openEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    form.reset({
      enquiry_date: enquiry.enquiry_date,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email ?? "",
      course: enquiry.course ?? "",
      institute: enquiry.institute,
      leadStatus: enquiry.leadStatus,
      demoStatus: enquiry.demoStatus,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingEnquiry(null);
    form.reset({
      enquiry_date: todayStr(),
      institute: "PST",
      leadStatus: "PROSPECTIVE",
      demoStatus: "PENDING",
    });
    setDialogOpen(true);
  };

  const columns: ColumnDef<Enquiry>[] = [
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
      header: "Institute",
      cell: ({ getValue }) => {
        const v = getValue<string>() ?? "-";
        return <Badge variant={INSTITUTE_BADGE[v] ?? "outline"}>{v}</Badge>;
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
              className="h-8 w-8"
              onClick={() => openEdit(e)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enquiry Management</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 ${isFetching ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2" /> Add Enquiry
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
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
              {FILTER_SELECTS.map(({ label, key, options }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={filters[key]}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, [key]: v }))
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
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({ fromDate: "", toDate: "", lead: "", demo: "" })
                }
              >
                <Search className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={9} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No enquiries found"
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
                  <Input
                    {...form.register("course")}
                    placeholder="Enter course"
                  />
                </div>
                {FORM_SELECTS.map(({ name, label, options }) => (
                  <div key={name} className="space-y-1">
                    <Label>{label}</Label>
                    <Select
                      value={form.watch(name) ?? ""}
                      onValueChange={(v) => form.setValue(name, v as never)}
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
