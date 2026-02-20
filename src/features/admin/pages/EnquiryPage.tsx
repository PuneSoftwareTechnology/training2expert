import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';

import { enquirySchema, type EnquiryFormValues } from '../schemas/enquiry.schema';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/format';
import { COURSES, INSTITUTES, LEAD_STATUSES, DEMO_STATUSES } from '@/constants/courses';
import type { LeadStatus, DemoStatus, Enquiry } from '@/types/student.types';

export default function EnquiryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterLead, setFilterLead] = useState<string>('');
  const [filterDemo, setFilterDemo] = useState<string>('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'enquiries', { fromDate, toDate, filterLead, filterDemo }],
    queryFn: () =>
      adminService.getEnquiries({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        leadStatus: (filterLead as LeadStatus) || undefined,
        demoStatus: (filterDemo as DemoStatus) || undefined,
      }),
  });

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      enquiryDate: new Date().toISOString().split('T')[0],
      institute: 'PST',
      leadStatus: 'PROSPECTIVE',
      demoStatus: 'PENDING',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EnquiryFormValues) => adminService.createEnquiry(data as Omit<Enquiry, 'id'>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      toast.success('Enquiry created');
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EnquiryFormValues> }) =>
      adminService.updateEnquiry(id, data as Partial<Enquiry>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      toast.success('Enquiry updated');
      setDialogOpen(false);
      setEditingEnquiry(null);
      form.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const convertMutation = useMutation({
    mutationFn: adminService.convertToEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] });
      toast.success('Converted to enrollment');
      setConvertId(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSubmit = (data: EnquiryFormValues) => {
    if (editingEnquiry) {
      updateMutation.mutate({ id: editingEnquiry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    form.reset({
      enquiryDate: enquiry.enquiryDate,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email ?? '',
      course: enquiry.course ?? '',
      institute: enquiry.institute,
      leadStatus: enquiry.leadStatus,
      demoStatus: enquiry.demoStatus,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingEnquiry(null);
    form.reset({
      enquiryDate: new Date().toISOString().split('T')[0],
      institute: 'PST',
      leadStatus: 'PROSPECTIVE',
      demoStatus: 'PENDING',
    });
    setDialogOpen(true);
  };

  const leadBadgeVariant = (status: LeadStatus) => {
    switch (status) {
      case 'PROSPECTIVE': return 'default' as const;
      case 'NON_PROSPECTIVE': return 'secondary' as const;
      case 'ENROLLED': return 'outline' as const;
    }
  };

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enquiry Management</h2>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Enquiry
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lead Status</Label>
                <Select value={filterLead} onValueChange={setFilterLead}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Demo Status</Label>
                <Select value={filterDemo} onValueChange={setFilterDemo}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {DEMO_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setFilterLead('');
                  setFilterDemo('');
                }}
              >
                <Search className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Institute</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Demo</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell className="text-sm">{formatDate(enquiry.enquiryDate)}</TableCell>
                      <TableCell className="font-medium">{enquiry.name}</TableCell>
                      <TableCell>{enquiry.phone}</TableCell>
                      <TableCell>{enquiry.email ?? '-'}</TableCell>
                      <TableCell>{enquiry.course ?? '-'}</TableCell>
                      <TableCell><Badge variant="outline">{enquiry.institute}</Badge></TableCell>
                      <TableCell><Badge variant={leadBadgeVariant(enquiry.leadStatus)}>{enquiry.leadStatus.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant={enquiry.demoStatus === 'DONE' ? 'default' : 'secondary'}>{enquiry.demoStatus}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(enquiry)}>Edit</Button>
                          {enquiry.leadStatus !== 'ENROLLED' && (
                            <Button variant="ghost" size="sm" onClick={() => setConvertId(enquiry.id)}>
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No enquiries found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEnquiry ? 'Edit Enquiry' : 'Add Enquiry'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" {...form.register('enquiryDate')} />
                </div>
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input {...form.register('name')} />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Phone *</Label>
                  <Input maxLength={10} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }} {...form.register('phone')} />
                  {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...form.register('email')} />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Select value={form.watch('course')} onValueChange={(v) => form.setValue('course', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Institute</Label>
                  <Select value={form.watch('institute')} onValueChange={(v) => form.setValue('institute', v as 'PST' | 'TCH')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INSTITUTES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Lead Status</Label>
                  <Select value={form.watch('leadStatus')} onValueChange={(v) => form.setValue('leadStatus', v as LeadStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Demo Status</Label>
                  <Select value={form.watch('demoStatus')} onValueChange={(v) => form.setValue('demoStatus', v as DemoStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEMO_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingEnquiry ? (updateMutation.isPending ? 'Updating...' : 'Update') : (createMutation.isPending ? 'Creating...' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Convert Confirmation */}
        <AlertDialog open={!!convertId} onOpenChange={() => setConvertId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convert to Enrollment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move the enquiry to the enrollment module and set its status to Enrolled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => convertId && convertMutation.mutate(convertId)} disabled={convertMutation.isPending}>
                {convertMutation.isPending ? 'Converting...' : 'Convert'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
