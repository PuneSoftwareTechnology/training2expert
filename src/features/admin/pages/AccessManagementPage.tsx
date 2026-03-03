import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
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

export default function AccessManagementPage() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountType, setAccountType] = useState<"recruiter" | "admin">(
    "recruiter",
  );
  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: "admin" | "recruiter";
  } | null>(null);

  const {
    data: recruiters,
    isLoading: loadingRecruiters,
    isError: isRecruiterError,
    error: recruiterError,
    refetch: refetchRecruiters,
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
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: superAdminService.getAdmins,
    enabled: isSuperAdmin,
  });

  const isLoading = loadingRecruiters || (isSuperAdmin && loadingAdmins);
  const isError = isRecruiterError || isAdminError;
  const error = recruiterError || adminError;

  const refetch = () => {
    refetchRecruiters();
    if (isSuperAdmin) refetchAdmins();
  };

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
      cell: ({ getValue }) => {
        const role = getValue<string>();
        return (
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              role === ROLES.SUPER_ADMIN &&
                "border-purple-200 bg-purple-50 text-purple-700",
              role === ROLES.ADMIN &&
                "border-blue-200 bg-blue-50 text-blue-700",
            )}
          >
            {role.toLowerCase().replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteData({ id: row.original.id, type: "admin" })}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
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
      ),
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Access Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage system administrators and recruiter accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            {isSuperAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setAccountType("admin");
                  adminForm.reset();
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setAccountType("recruiter");
                recruiterForm.reset();
                setDialogOpen(true);
              }}
            >
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
              <TabsTrigger value="admins">Administrators</TabsTrigger>
            )}
            <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
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

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Create {accountType === "admin" ? "Admin Account" : "Recruiter"}
              </DialogTitle>
            </DialogHeader>
            {accountType === "recruiter" ? (
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
            ) : (
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
