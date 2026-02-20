import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/format';

const recruiterSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RecruiterFormValues = z.infer<typeof recruiterSchema>;

export default function AccessManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: recruiters, isLoading } = useQuery({
    queryKey: ['admin', 'recruiters'],
    queryFn: adminService.getRecruiters,
  });

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recruiters'] });
      toast.success('Recruiter created');
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteRecruiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recruiters'] });
      toast.success('Recruiter deleted');
      setDeleteId(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSubmit = (data: RecruiterFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Access Management</h2>
          <Button onClick={() => { form.reset(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Recruiter
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.username}</TableCell>
                      <TableCell>{r.email ?? '-'}</TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Recruiter</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input {...form.register('username')} />
                {form.formState.errors.username && <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" {...form.register('password')} />
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create</Button>
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
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
