import { useRef, useState, useEffect, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Save, Plus, X, Upload, Pencil, GraduationCap, Briefcase, BookOpen, Award, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import {
  basicDetailsSchema, educationSchema, workExperienceSchema,
  type BasicDetailsFormValues, type EducationFormValues, type WorkExperienceFormValues,
} from '../../schemas/profile.schema';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';
import { EMPLOYMENT_STATUSES } from '@/constants/courses';
import { fadeUp } from './shared';
import type { StudentProfile } from '@/types/student.types';

interface ProfileDetailsSectionProps {
  profile: StudentProfile;
}

export default function ProfileDetailsSection({ profile }: ProfileDetailsSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [certInput, setCertInput] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Listen for edit toggle from mobile hamburger menu
  const toggleEdit = useCallback(() => setEditMode((prev) => !prev), []);
  useEffect(() => {
    window.addEventListener("toggle-profile-edit", toggleEdit);
    return () => window.removeEventListener("toggle-profile-edit", toggleEdit);
  }, [toggleEdit]);

  const isVerified = profile.enrollmentStatus === 'APPROVED';

  // ─── forms ───────────────────────────────────────────
  const basicForm = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
    values: { name: profile.name, phone: profile.phone, city: profile.city ?? '', area: profile.area ?? '' },
  });
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as Resolver<EducationFormValues>,
    values: {
      graduation: profile.graduation ?? '',
      graduationYear: profile.graduationYear,
      postGraduation: profile.postGraduation ?? '',
      pgYear: profile.pgYear,
      certifications: (profile.certifications ?? []).map((c) =>
        typeof c === 'string' ? { name: c } : c,
      ),
    },
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceSchema) as Resolver<WorkExperienceFormValues>,
    values: {
      employmentStatus: profile.employmentStatus,
      lastWorkedYear: profile.lastWorkedYear,
      itExperienceYears: profile.itExperienceYears,
      itExperienceMonths: profile.itExperienceMonths,
      nonItExperienceYears: profile.nonItExperienceYears,
      nonItExperienceMonths: profile.nonItExperienceMonths,
    },
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

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    updateMutation.mutate(payload as Partial<StudentProfile>, {
      onSuccess: () => setEditMode(false),
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

  return (
    <section id="section-profile" className={editMode ? "scroll-mt-28 md:scroll-mt-20" : "scroll-mt-20"}>
      {/* Mobile sticky edit bar */}
      {editMode && (
        <>
          <div className="fixed inset-x-0 top-14 z-20 flex items-center justify-between border-b border-blue-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-sm md:hidden dark:border-blue-900 dark:bg-slate-900/95">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Editing Profile</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit} className="rounded-lg">Cancel</Button>
              <Button size="sm" onClick={onSaveAll} loading={updateMutation.isPending} className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                {!updateMutation.isPending && <Save className="mr-1.5 h-3.5 w-3.5" />}
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
          {/* Spacer to push content below the fixed edit bar on mobile */}
          <div className="h-11 md:hidden" />
        </>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile Details</h1>
            <p className="text-sm text-muted-foreground">Manage your personal and educational background.</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {isVerified ? (
            <Badge className="rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Verified</Badge>
          ) : (
            <Badge className="rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Pending Verification</Badge>
          )}
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={onCancelEdit} className="rounded-xl">Cancel</Button>
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
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden border border-blue-100 bg-white shadow-lg shadow-blue-500/5 dark:border-blue-900/40 dark:bg-slate-900">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/20">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name <span className="text-destructive">*</span></Label>
                  <Input {...basicForm.register('name')} placeholder="Full Name" className="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900" />
                  {basicForm.formState.errors.name && <p className="text-xs text-destructive">{basicForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone <span className="text-destructive">*</span></Label>
                  <Input
                    maxLength={10}
                    onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                    {...basicForm.register('phone')}
                    placeholder="1234567890"
                    className="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  {basicForm.formState.errors.phone && <p className="text-xs text-destructive">{basicForm.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email <span className="text-destructive">*</span></Label>
                  <Input value={profile.email ?? ''} disabled placeholder="john@example.com" className="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
                  <Input {...basicForm.register('city')} placeholder="City" className="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div className="col-span-2 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Area</Label>
                  <Input {...basicForm.register('area')} placeholder="Area" className="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.name || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.phone || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{profile.email || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.city || '—'}</p>
                </div>
                <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Area</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.area || '—'}</p>
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
                  <AvatarImage src={profile.profilePhoto} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl font-bold text-blue-600">
                    {profile.name?.charAt(0).toUpperCase() ?? 'S'}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Graduation</Label>
                  <Input {...educationForm.register('graduation')} placeholder="Degree Name" className="h-9 rounded-lg border-violet-200 bg-white text-sm dark:border-violet-800 dark:bg-slate-900" />
                </div>
                <div className="space-y-1.5 rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grad. Year</Label>
                  <Input type="number" {...educationForm.register('graduationYear')} placeholder="YYYY" className="h-9 rounded-lg border-violet-200 bg-white text-sm dark:border-violet-800 dark:bg-slate-900" />
                </div>
                <div className="space-y-1.5 rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Post Graduation</Label>
                  <Input {...educationForm.register('postGraduation')} placeholder="Degree Name" className="h-9 rounded-lg border-violet-200 bg-white text-sm dark:border-violet-800 dark:bg-slate-900" />
                </div>
                <div className="space-y-1.5 rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PG Year</Label>
                  <Input type="number" {...educationForm.register('pgYear')} placeholder="YYYY" className="h-9 rounded-lg border-violet-200 bg-white text-sm dark:border-violet-800 dark:bg-slate-900" />
                </div>
                <div className="col-span-2 space-y-2.5 rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Certifications</Label>
                  <div className="space-y-2">
                    <Input
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      placeholder="e.g. AWS, PMP"
                      className="h-9 rounded-lg border-violet-200 bg-white text-sm dark:border-violet-800 dark:bg-slate-900"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-9 flex-1 rounded-lg border-violet-200 text-xs dark:border-violet-800" onClick={() => certFileInputRef.current?.click()}>
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {certFile ? certFile.name.slice(0, 12) + '...' : 'Upload'}
                      </Button>
                      <input
                        ref={certFileInputRef}
                        type="file"
                        accept=".pdf,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertFile(f); }}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addCertification} className="h-9 w-9 shrink-0 rounded-lg border-violet-200 dark:border-violet-800" disabled={certUploadMutation.isPending}>
                        {certUploadMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {(educationForm.watch('certifications') ?? []).length > 0 && (
                    <div className="space-y-2 pt-1">
                      {(educationForm.watch('certifications') ?? []).map((cert, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 dark:border-violet-800 dark:bg-slate-900">
                          <Award className="h-4 w-4 shrink-0 text-violet-500" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-violet-700 dark:text-violet-300">{cert.name}</span>
                          {cert.certificate && (
                            <a href={cert.certificate} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400">View</a>
                          )}
                          <button type="button" onClick={() => removeCertification(i)} className="shrink-0 text-violet-400 hover:text-violet-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Graduation</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.graduation || '—'}</p>
                </div>
                <div className="rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grad. Year</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.graduationYear || '—'}</p>
                </div>
                <div className="rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Post Graduation</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.postGraduation || '—'}</p>
                </div>
                <div className="rounded-xl bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PG Year</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.pgYear || '—'}</p>
                </div>
                <div className="col-span-2 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Certifications</p>
                  {(profile.certifications ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(profile.certifications ?? []).map((cert, i) => {
                        const c = typeof cert === 'string' ? { name: cert } : cert;
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 dark:border-violet-800 dark:bg-violet-900/20">
                            <Award className="h-4 w-4 shrink-0 text-violet-500" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-violet-700 dark:text-violet-300">{c.name}</span>
                            {c.certificate && (
                              <a href={c.certificate} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400">View</a>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select
                    value={workForm.watch('employmentStatus')}
                    onValueChange={(val) => workForm.setValue('employmentStatus', val as 'WORKING' | 'NON_WORKING' | 'FRESHER')}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-teal-200 bg-white text-sm dark:border-teal-800 dark:bg-slate-900"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Worked</Label>
                  <Input type="number" {...workForm.register('lastWorkedYear', { valueAsNumber: true })} placeholder="YYYY" className="h-9 rounded-lg border-teal-200 bg-white text-sm dark:border-teal-800 dark:bg-slate-900" />
                </div>
                <div className="space-y-1.5 rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IT Experience</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input type="number" className="h-9 rounded-lg border-teal-200 bg-white pr-8 text-sm dark:border-teal-800 dark:bg-slate-900" {...workForm.register('itExperienceYears', { valueAsNumber: true })} placeholder="0" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">yr</span>
                    </div>
                    <div className="relative flex-1">
                      <Input type="number" className="h-9 rounded-lg border-teal-200 bg-white pr-10 text-sm dark:border-teal-800 dark:bg-slate-900" {...workForm.register('itExperienceMonths', { valueAsNumber: true })} placeholder="0" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">mo</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Non-IT Exp.</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input type="number" className="h-9 rounded-lg border-teal-200 bg-white pr-8 text-sm dark:border-teal-800 dark:bg-slate-900" {...workForm.register('nonItExperienceYears', { valueAsNumber: true })} placeholder="0" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">yr</span>
                    </div>
                    <div className="relative flex-1">
                      <Input type="number" className="h-9 rounded-lg border-teal-200 bg-white pr-10 text-sm dark:border-teal-800 dark:bg-slate-900" {...workForm.register('nonItExperienceMonths', { valueAsNumber: true })} placeholder="0" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {EMPLOYMENT_STATUSES.find((s) => s.value === profile.employmentStatus)?.label || '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Worked</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.lastWorkedYear || '—'}</p>
                </div>
                <div className="rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IT Experience</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {profile.itExperienceYears || 0}y {profile.itExperienceMonths || 0}m
                  </p>
                </div>
                <div className="rounded-xl bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Non-IT Exp.</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {profile.nonItExperienceYears || 0}y {profile.nonItExperienceMonths || 0}m
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
