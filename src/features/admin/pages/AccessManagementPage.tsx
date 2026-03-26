import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Pencil } from "lucide-react";
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
import { ROLES } from "@/constants/roles";
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

const ROLE_COLORS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]:
    "border-purple-400 bg-purple-500/15 text-purple-700 dark:text-purple-300 dark:border-purple-600",
  [ROLES.ADMIN]:
    "border-sky-400 bg-sky-500/15 text-sky-700 dark:text-sky-300 dark:border-sky-600",
  [ROLES.RECRUITER]:
    "border-teal-400 bg-teal-500/15 text-teal-700 dark:text-teal-300 dark:border-teal-600",
};

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
    data: recruiters,
    isLoading: loadingRecruiters,
    isError: isRecruiterError,
    error: recruiterError,
    refetch: refetchRecruiters,
    isFetching: isFetchingRecruiters,
  } = useQuery({
    queryKey: ["admin", "recruiters"],
    queryFn: adminService.getRecruiters,
  });

  const {
    data: admins,
    isLoading: loadingAdmins,
    isError: isAdminError,
    error: adminError,
    refetch: refetchAdmins,
    isFetching: isFetchingAdmins,
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: superAdminService.getAdmins,
    enabled: isSuperAdmin,
  });

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

  const RoleBadge = ({ role }: { role?: string }) => {
    if (!role) return null;
    return (
      <Badge
        variant="outline"
        className={cn("capitalize font-medium", ROLE_COLORS[role])}
      >
        {role.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  // Columns
  const adminColumns: ColumnDef<AdminAccount>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => <RoleBadge role={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog("admin", row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDeleteData({ id: row.original.id, type: "admin" })
            }
            className="text-destructive"
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
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.companyName}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.designation}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span>{row.original.email}</span>
          <span className="text-muted-foreground">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => <RoleBadge role={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog("recruiter", row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDeleteData({ id: row.original.id, type: "recruiter" })
            }
            className="text-destructive"
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Access Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage system administrators and recruiter accounts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterActions
              onRefresh={refetch}
              isFetching={isFetching}
              showReset={false}
            />
            {isSuperAdmin && (
              <Button size="sm" onClick={() => openCreateDialog("admin")}>
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            )}
            <Button size="sm" onClick={() => openCreateDialog("recruiter")}>
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
              <Card>
                <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                  <h3 className="font-semibold text-sm">
                    System Administrators
                  </h3>
                  <Badge variant="secondary">{admins?.length || 0}</Badge>
                </div>
                <CardContent className="p-0">
                  {loadingAdmins ? (
                    <div className="p-6">
                      <TableSkeleton rows={5} columns={4} />
                    </div>
                  ) : (
                    <DataTable
                      columns={adminColumns}
                      data={admins || []}
                      emptyMessage="No administrators found"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="recruiters" className="mt-6">
            <Card>
              <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-sm">Registered Recruiters</h3>
                <Badge variant="secondary">{recruiters?.length || 0}</Badge>
              </div>
              <CardContent className="p-0">
                {loadingRecruiters ? (
                  <div className="p-6">
                    <TableSkeleton rows={5} columns={4} />
                  </div>
                ) : (
                  <DataTable
                    columns={recruiterColumns}
                    data={recruiters || []}
                    emptyMessage="No recruiters found"
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
