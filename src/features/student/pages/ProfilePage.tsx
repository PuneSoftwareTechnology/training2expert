import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';
import { ApprovalOverlay } from '../components/ApprovalOverlay';

import {
  basicDetailsSchema,
  educationSchema,
  workExperienceSchema,
  changePasswordSchema,
  type BasicDetailsFormValues,
  type EducationFormValues,
  type WorkExperienceFormValues,
  type ChangePasswordFormValues,
} from '../schemas/profile.schema';
import { studentService } from '@/services/student.service';
import { getErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { EMPLOYMENT_STATUSES } from '@/constants/courses';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const isApproved = useAuthStore((s) => s.user?.isApproved ?? false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certInput, setCertInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentService.getProfile,
  });

  // Basic Details form
  const basicForm = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone, city: profile.city ?? '', area: profile.area ?? '' }
      : undefined,
  });

  // Education form
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as Resolver<EducationFormValues>,
    values: profile
      ? {
          graduation: profile.graduation ?? '',
          graduationYear: profile.graduationYear,
          postGraduation: profile.postGraduation ?? '',
          pgYear: profile.pgYear,
          certifications: profile.certifications ?? [],
        }
      : undefined,
  });

  // Work form
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

  // Password form
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: studentService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const photoMutation = useMutation({
    mutationFn: studentService.uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Photo updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: studentService.changePassword,
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onBasicSubmit = (data: BasicDetailsFormValues) => updateMutation.mutate(data);
  const onEducationSubmit = (data: EducationFormValues) => updateMutation.mutate(data);
  const onWorkSubmit = (data: WorkExperienceFormValues) => updateMutation.mutate(data);
  const onPasswordSubmit = (data: ChangePasswordFormValues) => {
    passwordMutation.mutate({ oldPassword: data.oldPassword, newPassword: data.newPassword });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) photoMutation.mutate(file);
  };

  const addCertification = () => {
    if (certInput.trim()) {
      const current = educationForm.getValues('certifications') ?? [];
      educationForm.setValue('certifications', [...current, certInput.trim()]);
      setCertInput('');
    }
  };

  const removeCertification = (index: number) => {
    const current = educationForm.getValues('certifications') ?? [];
    educationForm.setValue(
      'certifications',
      current.filter((_, i) => i !== index),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Profile</h2>

        {/* Profile Photo + Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.profilePhoto} />
                <AvatarFallback className="text-lg">
                  {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                </AvatarFallback>
              </Avatar>
              {isApproved && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoMutation.isPending}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    {photoMutation.isPending ? 'Uploading...' : 'Change Photo'}
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...basicForm.register('name')} disabled={!isApproved} />
                  {basicForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{basicForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...basicForm.register('phone')} disabled={!isApproved} />
                  {basicForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{basicForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...basicForm.register('city')} disabled={!isApproved} />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input {...basicForm.register('area')} disabled={!isApproved} />
                </div>
              </div>
              {isApproved && (
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Basic Details
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Education Details */}
        <div className="relative">
          {!isApproved && <ApprovalOverlay />}
          <Card className={!isApproved ? 'pointer-events-none opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Education Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Graduation</Label>
                    <Input {...educationForm.register('graduation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input type="number" {...educationForm.register('graduationYear')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Post Graduation</Label>
                    <Input {...educationForm.register('postGraduation')} />
                  </div>
                  <div className="space-y-2">
                    <Label>PG Year</Label>
                    <Input type="number" {...educationForm.register('pgYear')} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      placeholder="Add certification"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCertification();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addCertification}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(educationForm.watch('certifications') ?? []).map((cert, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {cert}
                        <button type="button" onClick={() => removeCertification(i)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Education
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Work Experience */}
        <div className="relative">
          {!isApproved && <ApprovalOverlay />}
          <Card className={!isApproved ? 'pointer-events-none opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={workForm.handleSubmit(onWorkSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Employment Status</Label>
                    <Select
                      value={workForm.watch('employmentStatus')}
                      onValueChange={(val) =>
                        workForm.setValue('employmentStatus', val as 'WORKING' | 'NON_WORKING' | 'FRESHER')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Worked Year</Label>
                    <Input type="number" {...workForm.register('lastWorkedYear')} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>IT Exp (Years)</Label>
                    <Input type="number" {...workForm.register('itExperienceYears')} />
                  </div>
                  <div className="space-y-2">
                    <Label>IT Exp (Months)</Label>
                    <Input type="number" {...workForm.register('itExperienceMonths')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Non-IT (Years)</Label>
                    <Input type="number" {...workForm.register('nonItExperienceYears')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Non-IT (Months)</Label>
                    <Input type="number" {...workForm.register('nonItExperienceMonths')} />
                  </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Experience
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" {...passwordForm.register('oldPassword')} />
                  {passwordForm.formState.errors.oldPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.oldPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
