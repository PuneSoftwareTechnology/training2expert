import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { adminSchema, type AdminFormValues } from "../schemas/admin.schema";
import { superAdminService } from "@/services/super-admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/format";
import { useRole } from "@/hooks/useRole";
import type { AdminAccount } from "@/types/super-admin.types";

const FORM_FIELDS: {
  name: keyof AdminFormValues;
  label: string;
  type?: "email" | "password";
}[] = [
  { name: "name", label: "Name *" },
  { name: "email", label: "Email *", type: "email" },
  { name: "password", label: "Password *", type: "password" },
];

export default function ManageAdminsPage() {
  const { isSuperAdmin } = useRole();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: adminData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: superAdminService.getAdmins,
  });
  const admins = adminData?.items ?? [];

  const form = useForm<AdminFormValues>({ resolver: zodResolver(adminSchema) });

  const createMutation = useMutation({
    mutationFn: superAdminService.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin created");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: superAdminService.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      toast.success("Admin deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: ColumnDef<AdminAccount>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role" },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Created" />
      ),
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteId(row.original.id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 shadow-md shadow-sky-200/50">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isSuperAdmin ? "Manage Administrators" : "Manage Admins"}
              </h2>
              <p className="text-sm text-muted-foreground">
                System administrator accounts
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              form.reset();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/50 hover:from-sky-600 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Admin
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : admins.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <UserCog className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No admin accounts</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-sky-200/60 overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={admins}
                emptyMessage="No admin accounts"
                headerClassName="bg-gradient-to-r from-sky-500 to-blue-600"
              />
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((data) =>
                createMutation.mutate(data),
              )}
              className="space-y-4"
            >
              {FORM_FIELDS.map(({ name, label, type }) => (
                <div key={name} className="space-y-2">
                  <Label>{label}</Label>
                  {type === "password" ? (
                    <PasswordInput {...form.register(name)} />
                  ) : (
                    <Input
                      {...(type ? { type } : {})}
                      {...form.register(name)}
                    />
                  )}
                  {form.formState.errors[name] && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors[name]?.message}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Admin?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
