import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { recruiterSchema, type RecruiterFormValues } from '../schemas/recruiter.schema';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/format';
import type { RecruiterAccount } from '@/types/student.types';

const FORM_FIELDS: { name: keyof RecruiterFormValues; label: string; type?: 'email' | 'password'; required?: boolean }[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'username', label: 'Username', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Password', type: 'password', required: true },
];

export default function AccessManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: recruiters, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'recruiters'],
    queryFn: adminService.getRecruiters,
  });

  const form = useForm<RecruiterFormValues>({ resolver: zodResolver(recruiterSchema) });

  const createMutation = useMutation({
    mutationFn: adminService.createRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recruiters'] });
      toast.success('Recruiter created');
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recruiters'] });
      toast.success('Recruiter deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: ColumnDef<RecruiterAccount>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue<string>() || '-' },
    { accessorKey: 'role', header: 'Role' },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Access Management</h2>
          <Button onClick={() => { form.reset(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Recruiter
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : !recruiters || recruiters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No recruiters yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={recruiters} emptyMessage="No recruiters yet" />
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Recruiter</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              {FORM_FIELDS.map(({ name, label, type, required }) => (
                <div key={name} className="space-y-2">
                  <Label>{label}{required && ' *'}</Label>
                  {type === 'password' ? (
                    <PasswordInput {...form.register(name)} />
                  ) : (
                    <Input {...(type ? { type } : {})} {...form.register(name)} />
                  )}
                  {form.formState.errors[name] && <p className="text-xs text-destructive">{form.formState.errors[name]?.message}</p>}
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recruiter?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
