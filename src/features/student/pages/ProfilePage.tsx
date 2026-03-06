import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Save,
  Plus,
  X,
  Upload,
  Pencil,
  Star,
  CloudUpload,
  FileDown,
  AlertCircle,
  Wallet,
  QrCode,
  TrendingUp,
  MessageCircle,
  FolderUp,
  Sparkles,
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';

import {
  basicDetailsSchema,
  educationSchema,
  workExperienceSchema,
  type BasicDetailsFormValues,
  type EducationFormValues,
  type WorkExperienceFormValues,
} from '../schemas/profile.schema';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';
import { EMPLOYMENT_STATUSES } from '@/constants/courses';
import { formatCurrency } from '@/utils/format';
import type { StudentProfile } from '@/types/student.types';

/* ─── animation helpers ──────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

function SectionHeader({
  icon: Icon,
  gradient,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  gradient: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────── */
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [certInput, setCertInput] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);

  // ─── queries ─────────────────────────────────────────
  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentService.getProfile,
  });
  const { data: paymentData } = useQuery({
    queryKey: ['student', 'payments'],
    queryFn: studentService.getPaymentSummary,
  });
  const { data: evaluations } = useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: studentService.getEvaluations,
  });
  const { data: templates } = useQuery({
    queryKey: ['student', 'cv-templates'],
    queryFn: studentService.getCvTemplates,
  });
  const { data: myCv } = useQuery({
    queryKey: ['student', 'my-cv'],
    queryFn: studentService.getMyCv,
  });

  const isVerified = profile?.enrollmentStatus === 'APPROVED';

  // ─── forms ───────────────────────────────────────────
  const basicForm = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone, city: profile.city ?? '', area: profile.area ?? '' }
      : undefined,
  });
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as Resolver<EducationFormValues>,
    values: profile
      ? {
          graduation: profile.graduation ?? '',
          graduationYear: profile.graduationYear,
          postGraduation: profile.postGraduation ?? '',
          pgYear: profile.pgYear,
          certifications: (profile.certifications ?? []).map((c) =>
            typeof c === 'string' ? { name: c } : c
          ),
        }
      : undefined,
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceSchema) as Resolver<WorkExperienceFormValues>,
    values: profile
      ? {
          employmentStatus: profile.employmentStatus,
          lastWorkedYear: profile.lastWorkedYear,
          itExperienceYears: profile.itExperienceYears,
          itExperienceMonths: profile.itExperienceMonths,
          nonItExperienceYears: profile.nonItExperienceYears,
          nonItExperienceMonths: profile.nonItExperienceMonths,
        }
      : undefined,
  });

  // ─── mutations ───────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: studentService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const photoMutation = useMutation({
    mutationFn: studentService.uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Photo updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const cvUploadMutation = useMutation({
    mutationFn: studentService.uploadCv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'my-cv'] });
      toast.success('CV uploaded successfully');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const certUploadMutation = useMutation({
    mutationFn: studentService.uploadCertificate,
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ─── handlers ────────────────────────────────────────
  const toNum = (v: unknown) => { const n = Number(v); return Number.isNaN(n) ? undefined : n; };
  const toYear = (v: unknown) => { const n = Number(v); return n >= 1980 && n <= 2030 ? n : undefined; };

  const onSaveAll = () => {
    const basic = basicForm.getValues();
    const education = educationForm.getValues();
    const work = workForm.getValues();

    const payload: Record<string, unknown> = {
      name: basic.name || undefined,
      phone: basic.phone || undefined,
      city: basic.city || undefined,
      area: basic.area || undefined,
      graduation: education.graduation || undefined,
      graduationYear: toYear(education.graduationYear),
      postGraduation: education.postGraduation || undefined,
      pgYear: toYear(education.pgYear),
      certifications: education.certifications,
      employmentStatus: work.employmentStatus || undefined,
      lastWorkedYear: toYear(work.lastWorkedYear),
      itExperienceYears: toNum(work.itExperienceYears) ?? 0,
      itExperienceMonths: toNum(work.itExperienceMonths) ?? 0,
      nonItExperienceYears: toNum(work.nonItExperienceYears) ?? 0,
      nonItExperienceMonths: toNum(work.nonItExperienceMonths) ?? 0,
    };

    // Remove undefined keys so they don't get sent
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    console.log('[ProfilePage] work form raw values:', work);
    console.log('[ProfilePage] payload being sent:', payload);

    updateMutation.mutate(payload as Partial<StudentProfile>, {
      onSuccess: () => {
        refetch();
        setEditMode(false);
      },
    });
  };
  const onCancelEdit = () => {
    basicForm.reset();
    educationForm.reset();
    workForm.reset();
    setEditMode(false);
  };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) photoMutation.mutate(file);
  };
  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) cvUploadMutation.mutate(file);
  };
  const addCertification = async () => {
    if (!certInput.trim()) return;
    let certificateUrl: string | undefined;
    if (certFile) {
      try {
        const res = await certUploadMutation.mutateAsync(certFile);
        certificateUrl = res.url;
      } catch {
        return;
      }
    }
    const current = educationForm.getValues('certifications') ?? [];
    educationForm.setValue('certifications', [...current, { name: certInput.trim(), certificate: certificateUrl }]);
    setCertInput('');
    setCertFile(null);
    if (certFileInputRef.current) certFileInputRef.current.value = '';
  };
  const removeCertification = (index: number) => {
    const current = educationForm.getValues('certifications') ?? [];
    educationForm.setValue('certifications', current.filter((_, i) => i !== index));
  };
  const handleDownloadTemplate = (url: string, course: string, level: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course}_${level}_Template`;
    link.click();
  };

  // ─── computed ────────────────────────────────────────
  const avgTechnical =
    evaluations && evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.technicalScore, 0) / evaluations.length) * 10)
      : 0;
  const avgCommunication =
    evaluations && evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.communicationScore, 0) / evaluations.length) * 10) / 10
      : 0;
  const scopeText = evaluations?.find((e) => e.scopeForImprovement)?.scopeForImprovement ?? '';
  const projectUrl = evaluations?.find((e) => e.projectSubmission)?.projectSubmission;
  const templatesByCourse =
    templates?.reduce(
      (acc, t) => {
        if (!acc[t.course]) acc[t.course] = [];
        acc[t.course].push(t);
        return acc;
      },
      {} as Record<string, typeof templates>,
    ) ?? {};

  // ─── loading / error ─────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }
  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      {/* ─── Mobile sticky edit bar ─── */}
      {editMode && (
        <div className="fixed inset-x-0 top-14 z-20 flex items-center justify-between border-b border-blue-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-sm md:hidden dark:border-blue-900 dark:bg-slate-900/95">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Editing Profile</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancelEdit} className="rounded-lg">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSaveAll}
              loading={updateMutation.isPending}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {!updateMutation.isPending && <Save className="mr-1.5 h-3.5 w-3.5" />}
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
      <div className={`space-y-12 pb-8 ${editMode ? 'pt-12 md:pt-0' : ''}`}>
        {/* ══════════════════════════════════════════════
            SECTION 1 — PROFILE DETAILS
            ══════════════════════════════════════════════ */}
        <section id="section-profile" className="scroll-mt-20">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Profile Details</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your personal and educational background.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isVerified ? (
                <Badge className="rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Verified
                </Badge>
              ) : (
                <Badge className="rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Pending Verification
                </Badge>
              )}
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={onCancelEdit}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onSaveAll}
                      loading={updateMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      {!updateMutation.isPending && <Save className="mr-2 h-4 w-4" />}
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditMode(true)}
                    variant="outline"
                    className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Enrollment status alert */}
          {!isVerified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Your enrollment is pending approval. Some features may be restricted until your enrollment is approved.
              </p>
            </motion.div>
          )}

          {/* Personal Details + Photo */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
          >
            <Card className="overflow-hidden border border-blue-100 bg-white shadow-lg shadow-blue-500/5 dark:border-blue-900/40 dark:bg-slate-900">
              <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/20">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {editMode ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name <span className="text-destructive">*</span></Label>
                      <Input {...basicForm.register('name')} placeholder="Full Name" className="rounded-lg" />
                      {basicForm.formState.errors.name && <p className="text-sm text-destructive">{basicForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone <span className="text-destructive">*</span></Label>
                      <Input
                        maxLength={10}
                        onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                        {...basicForm.register('phone')}
                        placeholder="+1 234 567 8900"
                        className="rounded-lg"
                      />
                      {basicForm.formState.errors.phone && <p className="text-sm text-destructive">{basicForm.formState.errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Email <span className="text-destructive">*</span></Label>
                      <Input value={profile?.email ?? ''} disabled placeholder="john.doe@example.com" className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input {...basicForm.register('city')} placeholder="City" className="rounded-lg" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Area</Label>
                      <Input {...basicForm.register('area')} placeholder="Area" className="rounded-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</p>
                      <p className="text-sm font-medium">{profile?.name || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{profile?.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{profile?.email || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</p>
                      <p className="text-sm font-medium">{profile?.city || '—'}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</p>
                      <p className="text-sm font-medium">{profile?.area || '—'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Photo */}
            <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-500/5 dark:border-blue-900/40 dark:bg-slate-900">
              <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/20">
                <CardTitle className="text-lg font-semibold">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <div className="relative">
                  <div className="rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-500 p-1 shadow-lg shadow-indigo-500/30">
                    <Avatar className="h-28 w-28 border-4 border-card">
                      <AvatarImage src={profile?.profilePhoto} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl font-bold text-blue-600">
                        {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {editMode && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -right-1 bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <p className="text-center text-xs text-muted-foreground">Max size 2MB. JPG/PNG supported.</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Education + Work Experience */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Education */}
            <Card className="overflow-hidden border border-violet-100 bg-white shadow-lg shadow-violet-500/5 dark:border-violet-900/40 dark:bg-slate-900">
              <CardHeader className="border-b border-violet-100/50 bg-gradient-to-r from-violet-50/80 to-purple-50/50 dark:border-violet-900/30 dark:from-violet-950/30 dark:to-purple-950/20">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <GraduationCap className="h-4 w-4 text-violet-600" />
                  Education Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {editMode ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graduation</Label>
                      <Input {...educationForm.register('graduation')} placeholder="Degree Name" className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graduation Year</Label>
                      <Input type="number" {...educationForm.register('graduationYear')} placeholder="YYYY" className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Graduation</Label>
                      <Input {...educationForm.register('postGraduation')} placeholder="Degree Name" className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PG Year</Label>
                      <Input type="number" {...educationForm.register('pgYear')} placeholder="YYYY" className="rounded-lg" />
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certifications</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={certInput}
                          onChange={(e) => setCertInput(e.target.value)}
                          placeholder="Certification name (e.g. AWS, PMP)"
                          className="rounded-lg"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs"
                            onClick={() => certFileInputRef.current?.click()}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            {certFile ? certFile.name.slice(0, 15) + '...' : 'Upload File'}
                          </Button>
                          <input
                            ref={certFileInputRef}
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertFile(f); }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addCertification}
                            className="rounded-lg"
                            disabled={certUploadMutation.isPending}
                          >
                            {certUploadMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {(educationForm.watch('certifications') ?? []).length > 0 && (
                        <div className="space-y-2 pt-1">
                          {(educationForm.watch('certifications') ?? []).map((cert, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800 dark:bg-violet-900/20">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-violet-500" />
                                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{cert.name}</span>
                                {cert.certificate && (
                                  <a href={cert.certificate} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400">
                                    View
                                  </a>
                                )}
                              </div>
                              <button type="button" onClick={() => removeCertification(i)} className="text-violet-400 hover:text-violet-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graduation</p>
                      <p className="text-sm font-medium">{profile?.graduation || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graduation Year</p>
                      <p className="text-sm font-medium">{profile?.graduationYear || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Graduation</p>
                      <p className="text-sm font-medium">{profile?.postGraduation || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PG Year</p>
                      <p className="text-sm font-medium">{profile?.pgYear || '—'}</p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certifications</p>
                      {(profile?.certifications ?? []).length > 0 ? (
                        <div className="space-y-2">
                          {(profile?.certifications ?? []).map((cert, i) => {
                            const c = typeof cert === 'string' ? { name: cert } : cert;
                            return (
                              <div key={i} className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800 dark:bg-violet-900/20">
                                <Award className="h-4 w-4 text-violet-500" />
                                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{c.name}</span>
                                {c.certificate && (
                                  <a href={c.certificate} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400">
                                    View Certificate
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm font-medium">—</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="overflow-hidden border border-teal-100 bg-white shadow-lg shadow-teal-500/5 dark:border-teal-900/40 dark:bg-slate-900">
              <CardHeader className="border-b border-teal-100/50 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 dark:border-teal-900/30 dark:from-teal-950/30 dark:to-emerald-950/20">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Briefcase className="h-4 w-4 text-teal-600" />
                  Work Experience Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Status</Label>
                        <Select
                          value={workForm.watch('employmentStatus')}
                          onValueChange={(val) => workForm.setValue('employmentStatus', val as 'WORKING' | 'NON_WORKING' | 'FRESHER')}
                        >
                          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Worked Year</Label>
                        <Input type="number" {...workForm.register('lastWorkedYear', { valueAsNumber: true })} placeholder="YYYY" className="rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="w-28 text-sm font-medium">IT Experience</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" className="w-20 rounded-lg" {...workForm.register('itExperienceYears', { valueAsNumber: true })} placeholder="Yrs" />
                          <span className="text-xs text-muted-foreground">Years</span>
                          <Input type="number" className="w-20 rounded-lg" {...workForm.register('itExperienceMonths', { valueAsNumber: true })} placeholder="Mo" />
                          <span className="text-xs text-muted-foreground">Months</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="w-28 text-sm font-medium">Non-IT Exp</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" className="w-20 rounded-lg" {...workForm.register('nonItExperienceYears', { valueAsNumber: true })} placeholder="Yrs" />
                          <span className="text-xs text-muted-foreground">Years</span>
                          <Input type="number" className="w-20 rounded-lg" {...workForm.register('nonItExperienceMonths', { valueAsNumber: true })} placeholder="Mo" />
                          <span className="text-xs text-muted-foreground">Months</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Status</p>
                      <p className="text-sm font-medium">
                        {EMPLOYMENT_STATUSES.find((s) => s.value === profile?.employmentStatus)?.label || '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Worked Year</p>
                      <p className="text-sm font-medium">{profile?.lastWorkedYear || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IT Experience</p>
                      <p className="text-sm font-medium">
                        {profile?.itExperienceYears || 0} Years, {profile?.itExperienceMonths || 0} Months
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Non-IT Experience</p>
                      <p className="text-sm font-medium">
                        {profile?.nonItExperienceYears || 0} Years, {profile?.nonItExperienceMonths || 0} Months
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 — PAYMENT & FEES
            ══════════════════════════════════════════════ */}
        <section id="section-payment" className="scroll-mt-20">
          <div className="mb-8 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent dark:via-emerald-700/30" />
          <SectionHeader icon={Wallet} gradient="from-emerald-500 to-teal-600" title="Payment & Fees" subtitle="Fee summary & payment options" />

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Fee cards */}
            <div className="space-y-4">
              {/* Total */}
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Fees</p>
                    <p className="text-2xl font-bold">{formatCurrency(paymentData?.total_fee ?? 0)}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">Managed by Admin</Badge>
                  </div>
                </CardContent>
              </Card>
              {/* Paid */}
              <Card className="overflow-hidden border border-emerald-100 border-l-4 border-l-emerald-500 bg-white shadow-lg shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900 dark:border-l-emerald-500">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/30">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Paid Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(paymentData?.paid_amount ?? 0)}</p>
                  </div>
                </CardContent>
              </Card>
              {/* Pending */}
              <Card className="overflow-hidden border border-rose-100 border-l-4 border-l-rose-500 bg-white shadow-lg shadow-rose-500/5 dark:border-rose-900/40 dark:bg-slate-900 dark:border-l-rose-500">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-red-200 dark:from-rose-900/40 dark:to-red-900/30">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Pending Amount</p>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(paymentData?.pending_amount ?? 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code */}
            <Card className="border border-emerald-100 bg-white shadow-lg dark:border-emerald-900/40 dark:bg-slate-900">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30">
                  <QrCode className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold">Scan to Pay</h3>
                {paymentData?.qr_code_url ? (
                  <img src={paymentData.qr_code_url} alt="Payment QR Code" className="h-48 w-48 rounded-xl border-2 border-dashed border-emerald-200 object-contain p-3 dark:border-emerald-800" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                    <p className="text-sm text-muted-foreground">No QR available</p>
                  </div>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  Use any UPI app to scan and complete<br />your pending balance payment.
                </p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
                  <FileDown className="h-4 w-4" />
                  Download Invoice PDF
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — ACADEMIC EVALUATION
            ══════════════════════════════════════════════ */}
        <section id="section-evaluation" className="scroll-mt-20">
          <div className="mb-8 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent dark:via-violet-700/30" />
          <SectionHeader icon={Award} gradient="from-violet-500 to-purple-600" title="Academic Evaluation" subtitle="Performance scores & feedback" />

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Technical Score */}
            <Card className="overflow-hidden border border-violet-100 bg-white shadow-lg shadow-violet-500/5 dark:border-violet-900/40 dark:bg-slate-900">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
              <CardContent className="pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                    Technical Score
                  </h3>
                  <span className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-lg font-bold text-white shadow-sm">
                    {avgTechnical}%
                  </span>
                </div>
                <div className="space-y-3">
                  {evaluations && evaluations.length > 0 ? (
                    evaluations.map((evaluation, idx) => (
                      <motion.div
                        key={evaluation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{evaluation.courseName}</span>
                          <span className="font-semibold text-violet-600">{evaluation.technicalScore * 10}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${evaluation.technicalScore * 10}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.15, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                          />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No evaluations yet</p>
                  )}
                </div>
                <p className="mt-4 text-xs italic text-muted-foreground">Objective exams are time-bound. Modules must be completed sequentially.</p>
              </CardContent>
            </Card>

            {/* Communication Score */}
            <Card className="overflow-hidden border border-amber-100 bg-white shadow-lg shadow-amber-500/5 dark:border-amber-900/40 dark:bg-slate-900">
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
              <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="mb-3 font-semibold">Communication Score</h3>
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-5xl font-bold"
                >
                  {evaluations && evaluations.length > 0 ? `${avgCommunication.toFixed(0)}/10` : '-/10'}
                </motion.p>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: star * 0.1, type: 'spring', stiffness: 300 }}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= Math.round(avgCommunication / 2)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                            : 'text-muted-foreground/20'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Manually updated by Trainer</p>
              </CardContent>
            </Card>

            {/* Project Submission */}
            <Card className="overflow-hidden border border-sky-100 bg-white shadow-lg shadow-sky-500/5 dark:border-sky-900/40 dark:bg-slate-900">
              <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
              <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
                <h3 className="mb-4 font-semibold">Project Submission</h3>
                {projectUrl ? (
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/30"
                    >
                      <Upload className="h-8 w-8 text-emerald-600" />
                    </motion.div>
                    <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                      View Submission
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.05, borderColor: 'rgb(56 189 248 / 0.5)' }}
                      className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-colors"
                      onClick={() => projectInputRef.current?.click()}
                    >
                      <CloudUpload className="h-8 w-8 text-muted-foreground/40" />
                    </motion.div>
                    <p className="text-sm font-medium text-muted-foreground">Upload PDF</p>
                    <p className="text-xs text-muted-foreground">Maximum 10MB</p>
                    <input ref={projectInputRef} type="file" accept=".pdf" className="hidden" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Scope for Improvement */}
          {scopeText && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <Card className="overflow-hidden border border-amber-100 bg-white shadow-lg dark:border-amber-900/40 dark:bg-slate-900">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Scope for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-4 dark:from-amber-950/20 dark:to-orange-950/10">
                    <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">"{scopeText}"</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — CAREER & RESUME
            ══════════════════════════════════════════════ */}
        <section id="section-cv" className="scroll-mt-20">
          <div className="mb-8 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent dark:via-orange-700/30" />
          <SectionHeader icon={FolderUp} gradient="from-orange-500 to-rose-600" title="Career & Resume" subtitle="Templates & CV upload" />

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Templates */}
            <Card className="overflow-hidden border border-orange-100 bg-white shadow-lg dark:border-orange-900/40 dark:bg-slate-900">
              <div className="h-1 bg-gradient-to-r from-orange-400 to-rose-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Download Templates</CardTitle>
                  <Badge className="rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-xs text-white shadow-sm">Required</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(templatesByCourse).length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {Object.entries(templatesByCourse).map(([course, courseTemplates]) => (
                      <div key={course} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium">{course}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.includes('SAP') ? 'Finance & Controlling Professional Template'
                              : course.includes('Data') ? 'Business Intelligence & Viz Template'
                              : course.includes('Cyber') ? 'Security Analyst & Pentesting Template'
                              : 'Professional Template'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {courseTemplates.map((template) => (
                            <Button
                              key={template.id}
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => handleDownloadTemplate(template.downloadUrl, template.course, template.experienceLevel)}
                            >
                              {template.experienceLevel === 'FRESHER' ? 'Fresher' : 'Experienced'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No templates available yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Upload CV */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Card className="overflow-hidden border border-violet-500/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/30">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
                  >
                    <CloudUpload className="h-8 w-8" />
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">Upload Your CV</h3>
                    <p className="mt-1 text-sm text-white/70">
                      Once uploaded, our recruitment team will review your profile for placement opportunities.
                    </p>
                  </div>
                  {myCv?.url && (
                    <a href={myCv.url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white/80 hover:text-white">
                      View current CV
                    </a>
                  )}
                  <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="secondary"
                      className="rounded-xl bg-white px-6 font-semibold text-violet-700 shadow-lg hover:bg-white/90"
                      onClick={() => cvInputRef.current?.click()}
                      loading={cvUploadMutation.isPending}
                    >
                      {cvUploadMutation.isPending ? 'Uploading...' : 'Select Resume File'}
                    </Button>
                  </motion.div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">PDF format only</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
}
