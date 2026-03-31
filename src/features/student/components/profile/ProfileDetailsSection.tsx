import { useRef, useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  Plus,
  X,
  Upload,
  Pencil,
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  basicDetailsSchema,
  educationSchema,
  workExperienceSchema,
  type BasicDetailsFormValues,
  type EducationFormValues,
  type WorkExperienceFormValues,
} from "../../schemas/profile.schema";
import { studentService } from "@/services/student.service";
import { getErrorMessage } from "@/services/api";
import { EMPLOYMENT_STATUSES } from "@/constants/courses";
import { fadeUp } from "./shared";
import type { StudentProfile } from "@/types/student.types";

interface ProfileDetailsSectionProps {
  profile: StudentProfile;
}

/* ─── Small reusable pieces ──────────────────────────────────── */

function InfoItem({
  label,
  value,
  className = "",
  fullWidth = false,
}: {
  label: string;
  value: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`${fullWidth ? "col-span-2" : ""} ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 break-words text-[13px] font-semibold leading-snug text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

export default function ProfileDetailsSection({
  profile,
}: ProfileDetailsSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [certInput, setCertInput] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  // Listen for edit toggle from mobile hamburger menu
  const toggleEdit = useCallback(() => setEditMode((prev) => !prev), []);
  useEffect(() => {
    window.addEventListener("toggle-profile-edit", toggleEdit);
    return () => window.removeEventListener("toggle-profile-edit", toggleEdit);
  }, [toggleEdit]);

  const isVerified = profile.enrollmentStatus === "APPROVED";

  // ─── forms ───────────────────────────────────────────
  const basicForm = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
    values: {
      name: profile.name,
      phone: profile.phone,
      city: profile.city ?? "",
      area: profile.area ?? "",
    },
  });
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as Resolver<EducationFormValues>,
    values: {
      graduation: profile.graduation ?? "",
      graduationYear: profile.graduationYear,
      postGraduation: profile.postGraduation ?? "",
      pgYear: profile.pgYear,
      certifications: (profile.certifications ?? []).map((c) =>
        typeof c === "string" ? { name: c } : c,
      ),
    },
    resetOptions: { keepDirtyValues: true },
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(
      workExperienceSchema,
    ) as Resolver<WorkExperienceFormValues>,
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
      queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const photoMutation = useMutation({
    mutationFn: studentService.uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
      toast.success("Photo updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const certUploadMutation = useMutation({
    mutationFn: studentService.uploadCertificate,
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ─── handlers ────────────────────────────────────────
  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const toYear = (v: unknown) => {
    const n = Number(v);
    return n >= 1980 && n <= 2030 ? n : undefined;
  };

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
    const current = educationForm.getValues("certifications") ?? [];
    educationForm.setValue("certifications", [
      ...current,
      { name: certInput.trim(), certificate: certificateUrl },
    ], { shouldDirty: true });
    setCertInput("");
    setCertFile(null);
    if (certFileInputRef.current) certFileInputRef.current.value = "";
    setCertDialogOpen(false);
  };

  const removeCertification = (index: number) => {
    const current = educationForm.getValues("certifications") ?? [];
    educationForm.setValue(
      "certifications",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <section
      id="section-profile"
      className={editMode ? "scroll-mt-28 md:scroll-mt-20" : "scroll-mt-20"}
    >
      {/* Mobile sticky edit bar */}
      {editMode && (
        <>
          <div className="fixed inset-x-0 top-14 z-20 flex items-center justify-between border-b border-blue-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-sm md:hidden dark:border-blue-900 dark:bg-slate-900/95">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Editing Profile
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSaveAll}
                loading={updateMutation.isPending}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {!updateMutation.isPending && (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <div className="h-11 md:hidden" />
        </>
      )}

      {/* Enrollment status alert */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/30"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Your enrollment is pending approval. Some features may be
            restricted.
          </p>
        </motion.div>
      )}

      {/* ─── HERO PROFILE CARD ─────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-purple-800 dark:bg-cyan-900">
          {/* Gradient banner */}
          <div className="relative h-28 bg-gradient-to-br from-purple-800 via-cyan-700 to-cyan-600 sm:h-32 dark:from-slate-800 dark:via-slate-750 dark:to-slate-700">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-500/10 to-transparent" />

            {/* Desktop edit controls - inside banner */}
            <div className="absolute right-4 top-4 hidden items-center gap-2 md:flex">
              {isVerified ? (
                <Badge className="rounded-full border-0 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Verified
                </Badge>
              ) : (
                <Badge className="rounded-full border-0 bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-100 backdrop-blur-sm">
                  Pending
                </Badge>
              )}
              {editMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelEdit}
                    className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSaveAll}
                    loading={updateMutation.isPending}
                    className="rounded-full bg-white text-slate-800 shadow-lg hover:bg-white/90"
                  >
                    {!updateMutation.isPending && (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditMode(true)}
                  size="sm"
                  className="rounded-full border-0 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile info row */}
          <div className="relative px-4 pb-5 sm:px-6">
            {/* Avatar - overlapping the banner */}
            <div className="-mt-14 mb-4 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative shrink-0">
                <div className="rounded-full border-4 border-white bg-white shadow-lg dark:border-slate-900">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                    <AvatarImage src={profile.profilePhoto} />
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-3xl font-bold text-white sm:text-4xl">
                      {profile.name?.charAt(0).toUpperCase() ?? "S"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {editMode && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -right-1 bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-white shadow-md dark:border-slate-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center sm:pb-1 sm:text-left">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {profile.name || "Student"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phone}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {profile.course && (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <BookOpen className="mr-1 h-3 w-3" />
                      {profile.course}
                    </Badge>
                  )}
                  {profile.batch && (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {profile.batch}
                    </Badge>
                  )}
                  {/* Mobile verification badge */}
                  <span className="sm:hidden">
                    {isVerified ? (
                      <Badge className="rounded-full bg-emerald-50 px-3 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-amber-50 px-3 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Pending
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── DETAILS GRID ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Personal Details */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Personal Details
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {editMode ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...basicForm.register("name")}
                    placeholder="Full Name"
                    className="h-9 rounded-lg"
                  />
                  {basicForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {basicForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    maxLength={10}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /\D/g,
                        "",
                      );
                    }}
                    {...basicForm.register("phone")}
                    placeholder="1234567890"
                    className="h-9 rounded-lg"
                  />
                  {basicForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">
                      {basicForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    City
                  </Label>
                  <Input
                    {...basicForm.register("city")}
                    placeholder="City"
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Area
                  </Label>
                  <Input
                    {...basicForm.register("area")}
                    placeholder="Area"
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem label="Full Name" value={profile.name} />
                <InfoItem label="Phone" value={profile.phone} />
                <InfoItem label="Email" value={profile.email} fullWidth />
                <InfoItem label="City" value={profile.city || "—"} />
                <InfoItem label="Area" value={profile.area || "—"} />
              </div>
            )}
          </div>
        </div>

        {/* Education Details */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Education</h3>
          </div>
          <div className="space-y-3 p-4">
            {editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Graduation
                    </Label>
                    <Input
                      {...educationForm.register("graduation")}
                      placeholder="Degree"
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Year
                    </Label>
                    <Input
                      type="number"
                      {...educationForm.register("graduationYear")}
                      placeholder="YYYY"
                      className="h-9 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Post Grad
                    </Label>
                    <Input
                      {...educationForm.register("postGraduation")}
                      placeholder="Degree"
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Year
                    </Label>
                    <Input
                      type="number"
                      {...educationForm.register("pgYear")}
                      placeholder="YYYY"
                      className="h-9 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Certifications
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg px-2.5 text-xs"
                      onClick={() => setCertDialogOpen(true)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  {(educationForm.watch("certifications") ?? []).length > 0 ? (
                    <div className="space-y-1.5">
                      {(educationForm.watch("certifications") ?? []).map(
                        (cert, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <Award className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                            <span className="min-w-0 flex-1 truncate text-xs font-medium">
                              {cert.name}
                            </span>
                            {cert.certificate && (
                              <a
                                href={cert.certificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-[11px] text-blue-600 underline"
                              >
                                View
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => removeCertification(i)}
                              className="shrink-0 text-slate-400 hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No certifications added yet
                    </p>
                  )}

                  {/* Add Certification Dialog */}
                  <Dialog
                    open={certDialogOpen}
                    onOpenChange={(open) => {
                      setCertDialogOpen(open);
                      if (!open) {
                        setCertInput("");
                        setCertFile(null);
                        if (certFileInputRef.current)
                          certFileInputRef.current.value = "";
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Certification</DialogTitle>
                        <DialogDescription>
                          Enter the certification name and optionally attach a
                          supporting document.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">
                            Certification Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={certInput}
                            onChange={(e) => setCertInput(e.target.value)}
                            placeholder="e.g. AWS Solutions Architect, PMP"
                            className="h-10"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCertification();
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">
                            Certificate Document{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <div
                            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
                            onClick={() => certFileInputRef.current?.click()}
                          >
                            <Upload className="h-5 w-5 text-slate-400" />
                            <div className="min-w-0 flex-1">
                              {certFile ? (
                                <p className="truncate text-sm font-medium text-foreground">
                                  {certFile.name}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Click to upload PDF, JPEG, or PNG
                                </p>
                              )}
                            </div>
                            {certFile && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCertFile(null);
                                  if (certFileInputRef.current)
                                    certFileInputRef.current.value = "";
                                }}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <input
                            ref={certFileInputRef}
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setCertFile(f);
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setCertDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addCertification}
                          disabled={
                            !certInput.trim() || certUploadMutation.isPending
                          }
                        >
                          {certUploadMutation.isPending ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1.5 h-4 w-4" />
                              Add Certification
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem
                  label="Graduation"
                  value={profile.graduation || "—"}
                />
                <InfoItem
                  label="Grad. Year"
                  value={
                    profile.graduationYear
                      ? String(profile.graduationYear)
                      : "—"
                  }
                />
                <InfoItem
                  label="Post Graduation"
                  value={profile.postGraduation || "—"}
                />
                <InfoItem
                  label="PG Year"
                  value={profile.pgYear ? String(profile.pgYear) : "—"}
                />
                <div className="col-span-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Certifications
                  </p>
                  {(profile.certifications ?? []).length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(profile.certifications ?? []).map((cert, i) => {
                        const c =
                          typeof cert === "string" ? { name: cert } : cert;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                          >
                            {c.name}
                            {c.certificate && (
                              <a
                                href={c.certificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              >
                                <Upload className="h-3 w-3" />
                              </a>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                      —
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Experience */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <Briefcase className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Work Experience
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {editMode ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={workForm.watch("employmentStatus")}
                    onValueChange={(val) =>
                      workForm.setValue(
                        "employmentStatus",
                        val as "WORKING" | "NON_WORKING" | "FRESHER",
                      )
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Select" />
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
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Last Worked
                  </Label>
                  <Input
                    type="number"
                    {...workForm.register("lastWorkedYear", {
                      valueAsNumber: true,
                    })}
                    placeholder="YYYY"
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    IT Experience
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        className="h-9 rounded-lg pr-8"
                        {...workForm.register("itExperienceYears", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        yr
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        className="h-9 rounded-lg pr-10"
                        {...workForm.register("itExperienceMonths", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        mo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Non-IT Experience
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        className="h-9 rounded-lg pr-8"
                        {...workForm.register("nonItExperienceYears", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        yr
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        className="h-9 rounded-lg pr-10"
                        {...workForm.register("nonItExperienceMonths", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem
                  label="Status"
                  value={
                    EMPLOYMENT_STATUSES.find(
                      (s) => s.value === profile.employmentStatus,
                    )?.label || "—"
                  }
                />
                <InfoItem
                  label="Last Worked"
                  value={
                    profile.lastWorkedYear
                      ? String(profile.lastWorkedYear)
                      : "—"
                  }
                />
                <InfoItem
                  label="IT Experience"
                  value={`${profile.itExperienceYears || 0}y ${profile.itExperienceMonths || 0}m`}
                />
                <InfoItem
                  label="Non-IT Exp."
                  value={`${profile.nonItExperienceYears || 0}y ${profile.nonItExperienceMonths || 0}m`}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
