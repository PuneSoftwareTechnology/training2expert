import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';

import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';
import { COURSES } from '@/constants/courses';

export default function CandidateFilterPage() {
  const queryClient = useQueryClient();
  const [course, setCourse] = useState('');
  const [city, setCity] = useState('');
  const [minExp, setMinExp] = useState('');
  const [minTech, setMinTech] = useState('');
  const [minComm, setMinComm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailDialog, setEmailDialog] = useState(false);
  const [commentDialog, setCommentDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'candidates', { course, city, minExp, minTech, minComm }],
    queryFn: () =>
      adminService.getCandidateReport({
        course: course || undefined,
        city: city || undefined,
        minExperience: minExp ? Number(minExp) : undefined,
        minTechnicalRating: minTech ? Number(minTech) : undefined,
        minCommunicationRating: minComm ? Number(minComm) : undefined,
      }),
  });

  const downloadBulkMutation = useMutation({
    mutationFn: () => adminService.downloadBulkCvs(selectedIds),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CVs.zip';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CVs downloaded');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => adminService.sendBulkEmail(selectedIds, emailSubject, emailBody),
    onSuccess: () => {
      toast.success('Emails sent');
      setEmailDialog(false);
      setEmailSubject('');
      setEmailBody('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addCommentMutation = useMutation({
    mutationFn: () => adminService.addBulkComment(selectedIds, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports', 'candidates'] });
      toast.success('Comment added');
      setCommentDialog(false);
      setComment('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (!data?.items) return;
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((i) => i.id));
    }
  };

  const handleDownloadSingle = async (studentId: string) => {
    try {
      const blob = await adminService.downloadCv(studentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CV.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Candidate Filter Report</h2>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="w-32" placeholder="City" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Experience (yrs)</Label>
                <Input type="number" value={minExp} onChange={(e) => setMinExp(e.target.value)} className="w-24" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Tech Rating</Label>
                <Input type="number" value={minTech} onChange={(e) => setMinTech(e.target.value)} className="w-24" min="1" max="10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Comm Rating</Label>
                <Input type="number" value={minComm} onChange={(e) => setMinComm(e.target.value)} className="w-24" min="1" max="10" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCourse(''); setCity(''); setMinExp(''); setMinTech(''); setMinComm(''); }}>
                <Search className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => downloadBulkMutation.mutate()} disabled={downloadBulkMutation.isPending}>
              <Download className="mr-1 h-3.5 w-3.5" /> Download CVs
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEmailDialog(true)}>
              <Mail className="mr-1 h-3.5 w-3.5" /> Send Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCommentDialog(true)}>
              <MessageSquare className="mr-1 h-3.5 w-3.5" /> Add Comment
            </Button>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selectedIds.length === (data?.items?.length ?? 0) && selectedIds.length > 0} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Comm</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.course}</TableCell>
                      <TableCell>{row.city ?? '-'}</TableCell>
                      <TableCell>{row.itExperienceYears} yrs</TableCell>
                      <TableCell>{row.technicalScore}/10</TableCell>
                      <TableCell>{row.communicationScore}/10</TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">{row.remarks ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {row.cvUrl && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSingle(row.id)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No candidates found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Email Dialog */}
        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Bulk Email</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Subject</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} /></div>
              <div className="space-y-1"><Label>Body</Label><Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
                <Button onClick={() => sendEmailMutation.mutate()} disabled={sendEmailMutation.isPending}>Send</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={commentDialog} onOpenChange={setCommentDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Comment to Selected</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Enter comment..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCommentDialog(false)}>Cancel</Button>
                <Button onClick={() => addCommentMutation.mutate()} disabled={addCommentMutation.isPending}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
