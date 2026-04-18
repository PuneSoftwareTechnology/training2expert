import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Pencil, Shield } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import {
  recruiterSchema,
  type RecruiterFormValues,
} from "../schemas/recruiter.schema";
import { adminSchema, type AdminFormValues } from "../schemas/admin.schema";
import { adminService } from "@/services/admin.service";
import { superAdminService } from "@/services/super-admin.service";
import { getErrorMessage } from "@/services/api";
import type { RecruiterAccount } from "@/types/admin.types";
import type { AdminAccount } from "@/types/super-admin.types";

// Edit schemas (password not required when editing)
const recruiterEditSchema = recruiterSchema.omit({ password: true });
type RecruiterEditFormValues = z.infer<typeof recruiterEditSchema>;

const adminEditSchema = adminSchema.omit({ password: true });
type AdminEditFormValues = z.infer<typeof adminEditSchema>;

const FORM_FIELDS: {
  name: keyof RecruiterFormValues;
  label: string;
  type?: "email" | "password" | "tel";
  required?: boolean;
}[] = [
  { name: "name", label: "Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "companyName", label: "Company Name", required: true },
  { name: "designation", label: "Designation", required: false },
  { name: "password", label: "Password", type: "password", required: true },
];

const EDIT_FORM_FIELDS = FORM_FIELDS.filter((f) => f.name !== "password") as {
  name: keyof RecruiterEditFormValues;
  label: string;
  type?: "email" | "tel";
  required?: boolean;
}[];


export default function AccessManagementPage() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [accountType, setAccountType] = useState<"recruiter" | "admin">(
    "recruiter",
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: "admin" | "recruiter";
  } | null>(null);

  // Queries
  const {
    data: recruiterData,
    isLoading: loadingRecruiters,
    isError: isRecruiterError,
    error: recruiterError,
    refetch: refetchRecruiters,
    isFetching: isFetchingRecruiters,
  } = useQuery({
    queryKey: ["admin", "recruiters"],
    queryFn: () => adminService.getRecruiters(),
  });
  const recruiters = recruiterData?.items ?? [];

  const {
    data: adminData,
    isLoading: loadingAdmins,
    isError: isAdminError,
    error: adminError,
    refetch: refetchAdmins,
    isFetching: isFetchingAdmins,
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => superAdminService.getAdmins(),
    enabled: isSuperAdmin,
  });
  const admins = adminData?.items ?? [];

  const isFetching = isFetchingRecruiters || isFetchingAdmins;
  const isError = isRecruiterError || isAdminError;
  const error = recruiterError || adminError;

  const refetch = () => {
    refetchRecruiters();
    if (isSuperAdmin) refetchAdmins();
  };

  // Create forms
  const recruiterForm = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      designation: "",
      password: "",
    },
  });

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Edit forms
  const recruiterEditForm = useForm<RecruiterEditFormValues>({
    resolver: zodResolver(recruiterEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      designation: "",
    },
  });

  const adminEditForm = useForm<AdminEditFormValues>({
    resolver: zodResolver(adminEditSchema),
    defaultValues: { name: "", email: "" },
  });

  // Create mutations
  const createRecruiterMutation = useMutation({
    mutationFn: adminService.createRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "recruiters"] });
      toast.success("Recruiter created");
      setDialogOpen(false);
      recruiterForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createAdminMutation = useMutation({
    mutationFn: superAdminService.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin created");
      setDialogOpen(false);
      adminForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Update mutations
  const updateRecruiterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruiterEditFormValues }) =>
      adminService.updateRecruiter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "recruiters"] });
      toast.success("Recruiter updated");
      setDialogOpen(false);
      setEditId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminEditFormValues }) =>
      superAdminService.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin updated");
      setDialogOpen(false);
      setEditId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Delete mutations
  const deleteRecruiterMutation = useMutation({
    mutationFn: adminService.deleteRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "recruiters"] });
      toast.success("Recruiter deleted");
      setDeleteData(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteAdminMutation = useMutation({
    mutationFn: superAdminService.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin deleted");
      setDeleteData(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Helpers
  const openCreateDialog = (type: "admin" | "recruiter") => {
    setDialogMode("create");
    setAccountType(type);
    setEditId(null);
    if (type === "recruiter") recruiterForm.reset();
    else adminForm.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (
    type: "admin" | "recruiter",
    item: AdminAccount | RecruiterAccount,
  ) => {
    setDialogMode("edit");
    setAccountType(type);
    setEditId(item.id);
    if (type === "recruiter") {
      const r = item as RecruiterAccount;
      recruiterEditForm.reset({
        name: r.name,
        email: r.email,
        phone: r.phone,
        companyName: r.companyName,
        designation: r.designation || "",
      });
    } else {
      const a = item as AdminAccount;
      adminEditForm.reset({ name: a.name, email: a.email });
    }
    setDialogOpen(true);
  };

  // Columns
  const adminColumns: ColumnDef<AdminAccount>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold text-sm shrink-0">
            {row.original.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
            onClick={() => openEditDialog("admin", row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() =>
              setDeleteData({ id: row.original.id, type: "admin" })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const recruiterColumns: ColumnDef<RecruiterAccount>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 font-semibold text-sm shrink-0">
            {row.original.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.companyName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.designation || "-"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact No.",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || "-"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const lastLogin = row.original.lastLogin;
        const isActive = lastLogin
          ? new Date(lastLogin) > new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000)
          : false;
        return (
          <Badge
            variant={isActive ? "success" : "destructive"}
            className="text-xs"
          >
            {isActive ? "Active" : "Not Active"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10"
            onClick={() => openEditDialog("recruiter", row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() =>
              setDeleteData({ id: row.original.id, type: "recruiter" })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 p-2.5 shadow-md shadow-sky-200/50">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Access Management
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage system administrators and recruiter accounts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterActions
              onRefresh={refetch}
              isFetching={isFetching}
              showReset={false}
            />
            {isSuperAdmin && (
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={() => openCreateDialog("admin")}>
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            )}
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openCreateDialog("recruiter")}>
              <Plus className="mr-2 h-4 w-4" /> Create Recruiter
            </Button>
          </div>
        </div>

        <Tabs defaultValue="recruiters" className="w-full">
          <TabsList
            className={cn(
              "grid w-full grid-cols-2 max-w-[400px]",
              !isSuperAdmin && "grid-cols-1 max-w-[200px]",
            )}
          >
            {isSuperAdmin && (
              <TabsTrigger
                value="admins"
                className="data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300"
              >
                Administrators
              </TabsTrigger>
            )}
            <TabsTrigger
              value="recruiters"
              className="data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300"
            >
              Recruiters
            </TabsTrigger>
          </TabsList>

          {isSuperAdmin && (
            <TabsContent value="admins" className="mt-6">
              <Card className="border-sky-200 dark:border-sky-800/50 overflow-hidden">
                <div className="p-4 border-b border-sky-200 dark:border-sky-800/50 flex justify-between items-center bg-sky-50/80 dark:bg-sky-950/30">
                  <h3 className="font-semibold text-sm text-sky-800 dark:text-sky-300">
                    System Administrators
                  </h3>
                  <Badge className="bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700">
                    {admins?.length || 0}
                  </Badge>
                </div>
                <CardContent className="p-0">
                  {loadingAdmins ? (
                    <div className="p-6">
                      <TableSkeleton rows={5} columns={4} />
                    </div>
                  ) : (
                    <DataTable
                      columns={adminColumns}
                      data={admins}
                      emptyMessage="No administrators found"
                      headerClassName="bg-gradient-to-r from-sky-500 to-blue-600"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="recruiters" className="mt-6">
            <Card className="border-teal-200 dark:border-teal-800/50 overflow-hidden">
              <div className="p-4 border-b border-teal-200 dark:border-teal-800/50 flex justify-between items-center bg-teal-50/80 dark:bg-teal-950/30">
                <h3 className="font-semibold text-sm text-teal-800 dark:text-teal-300">Registered Recruiters</h3>
                <Badge className="bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700">
                  {recruiterData?.total ?? recruiters.length}
                </Badge>
              </div>
              <CardContent className="p-0">
                {loadingRecruiters ? (
                  <div className="p-6">
                    <TableSkeleton rows={5} columns={4} />
                  </div>
                ) : (
                  <DataTable
                    columns={recruiterColumns}
                    data={recruiters}
                    emptyMessage="No recruiters found"
                    headerClassName="bg-gradient-to-r from-teal-500 to-emerald-600"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? "Edit" : "Create"}{" "}
                {accountType === "admin" ? "Admin Account" : "Recruiter"}
              </DialogTitle>
            </DialogHeader>

            {/* Recruiter Create Form */}
            {accountType === "recruiter" && dialogMode === "create" && (
              <form
                onSubmit={recruiterForm.handleSubmit((data) =>
                  createRecruiterMutation.mutate(data),
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {FORM_FIELDS.map(({ name, label, type, required }) => (
                    <div
                      key={name}
                      className={cn(
                        "space-y-1.5",
                        (name === "name" || name === "password") &&
                          "col-span-2",
                      )}
                    >
                      <Label className="text-xs">
                        {label} {required && "*"}
                      </Label>
                      {type === "password" ? (
                        <>
                          <PasswordInput {...recruiterForm.register(name)} />
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            At least 8 chars, A-Z, a-z, and 0-9
                          </p>
                        </>
                      ) : (
                        <Input
                          type={type === "tel" ? "text" : type}
                          {...recruiterForm.register(name, {
                            ...(name === "phone" && {
                              onChange: (e) => {
                                e.target.value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);
                              },
                            }),
                          })}
                          maxLength={name === "phone" ? 10 : undefined}
                          className="h-9"
                        />
                      )}
                      {recruiterForm.formState.errors[name] && (
                        <p className="text-[10px] text-destructive">
                          {recruiterForm.formState.errors[name]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={createRecruiterMutation.isPending}
                    className="h-9 px-4"
                  >
                    {createRecruiterMutation.isPending
                      ? "Creating..."
                      : "Create Account"}
                  </Button>
                </div>
              </form>
            )}

            {/* Recruiter Edit Form */}
            {accountType === "recruiter" && dialogMode === "edit" && (
              <form
                onSubmit={recruiterEditForm.handleSubmit((data) =>
                  updateRecruiterMutation.mutate({ id: editId!, data }),
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {EDIT_FORM_FIELDS.map(({ name, label, type, required }) => (
                    <div
                      key={name}
                      className={cn(
                        "space-y-1.5",
                        name === "name" && "col-span-2",
                      )}
                    >
                      <Label className="text-xs">
                        {label} {required && "*"}
                      </Label>
                      <Input
                        type={type === "tel" ? "text" : type}
                        {...recruiterEditForm.register(name, {
                          ...(name === "phone" && {
                            onChange: (e) => {
                              e.target.value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10);
                            },
                          }),
                        })}
                        maxLength={name === "phone" ? 10 : undefined}
                        className="h-9"
                      />
                      {recruiterEditForm.formState.errors[name] && (
                        <p className="text-[10px] text-destructive">
                          {recruiterEditForm.formState.errors[name]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={updateRecruiterMutation.isPending}
                    className="h-9 px-4"
                  >
                    {updateRecruiterMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}

            {/* Admin Create Form */}
            {accountType === "admin" && dialogMode === "create" && (
              <form
                onSubmit={adminForm.handleSubmit((data) =>
                  createAdminMutation.mutate(data),
                )}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input {...adminForm.register("name")} className="h-9" />
                  {adminForm.formState.errors.name && (
                    <p className="text-[10px] text-destructive">
                      {adminForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    {...adminForm.register("email")}
                    className="h-9"
                  />
                  {adminForm.formState.errors.email && (
                    <p className="text-[10px] text-destructive">
                      {adminForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Password *</Label>
                  <PasswordInput {...adminForm.register("password")} />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    At least 8 chars, A-Z, a-z, and 0-9
                  </p>
                  {adminForm.formState.errors.password && (
                    <p className="text-[10px] text-destructive">
                      {adminForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={createAdminMutation.isPending}
                    className="h-9 px-4"
                  >
                    {createAdminMutation.isPending
                      ? "Creating..."
                      : "Create Admin"}
                  </Button>
                </div>
              </form>
            )}

            {/* Admin Edit Form */}
            {accountType === "admin" && dialogMode === "edit" && (
              <form
                onSubmit={adminEditForm.handleSubmit((data) =>
                  updateAdminMutation.mutate({ id: editId!, data }),
                )}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    {...adminEditForm.register("name")}
                    className="h-9"
                  />
                  {adminEditForm.formState.errors.name && (
                    <p className="text-[10px] text-destructive">
                      {adminEditForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    {...adminEditForm.register("email")}
                    className="h-9"
                  />
                  {adminEditForm.formState.errors.email && (
                    <p className="text-[10px] text-destructive">
                      {adminEditForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={updateAdminMutation.isPending}
                    className="h-9 px-4"
                  >
                    {updateAdminMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteData}
          onOpenChange={() => setDeleteData(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the{" "}
                {deleteData?.type === "admin" ? "administrator" : "recruiter"}{" "}
                account. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteData) return;
                  if (deleteData.type === "admin") {
                    deleteAdminMutation.mutate(deleteData.id);
                  } else {
                    deleteRecruiterMutation.mutate(deleteData.id);
                  }
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
