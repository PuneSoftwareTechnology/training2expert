import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { recruiterService } from "@/services/recruiter.service";
import type { EmploymentStatus } from "@/types/common.types";

interface ProfileDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function employmentLabel(status: EmploymentStatus) {
  switch (status) {
    case "WORKING":
      return "Currently Working";
    case "NON_WORKING":
      return "Not Working";
    case "FRESHER":
      return "Fresher";
  }
}

export function ProfileDialog({
  studentId,
  open,
  onOpenChange,
}: ProfileDialogProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["recruiter", "student-profile", studentId],
    queryFn: () => recruiterService.getStudentProfile(studentId),
    enabled: open && !!studentId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>
            View personal details, education background, and work experience for
            this student.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : profile ? (
          <ScrollArea className="max-h-[80vh]">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background px-5 pt-5 pb-3">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 ring-3 ring-background shadow-md">
                  {profile.profilePhoto && (
                    <AvatarImage src={profile.profilePhoto} alt={profile.name} />
                  )}
                  <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-2 text-base font-bold">{profile.name}</h2>
                {profile.course && (
                  <p className="text-xs text-muted-foreground">
                    {profile.course}
                    {profile.batch && ` - ${profile.batch}`}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 px-3 py-3">
              {/* Basic Details Section */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-2.5">
                <SectionHeader
                  icon={Mail}
                  label="Basic Details"
                  color="text-blue-600 dark:text-blue-400"
                  borderColor="border-blue-200 dark:border-blue-800"
                />
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  <ContactRow icon={Mail} value={profile.email} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" />
                  <ContactRow icon={Phone} value={profile.phone} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" />
                  {(profile.city || profile.area) && (
                    <ContactRow
                      icon={MapPin}
                      value={[profile.city, profile.area]
                        .filter(Boolean)
                        .join(", ")}
                      color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                    />
                  )}
                  <ContactRow
                    icon={Briefcase}
                    value={employmentLabel(profile.employmentStatus)}
                    color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              {/* Education Section */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-3 py-2.5">
                <SectionHeader
                  icon={GraduationCap}
                  label="Education"
                  color="text-emerald-600 dark:text-emerald-400"
                  borderColor="border-emerald-200 dark:border-emerald-800"
                />
                <div className="mt-2 space-y-2">
                  {profile.graduation && (
                    <EducationCard
                      degree={profile.graduation}
                      year={profile.graduationYear?.toString()}
                      dotColor="bg-emerald-400"
                    />
                  )}
                  {profile.postGraduation && (
                    <EducationCard
                      degree={profile.postGraduation}
                      year={profile.pgYear?.toString()}
                      dotColor="bg-emerald-600"
                    />
                  )}
                  {profile.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.certifications.map((cert, i) => {
                        const c =
                          typeof cert === "string" ? { name: cert } : cert;
                        const url = c.certificate;
                        return url?.startsWith("http") ? (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-xs border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                            >
                              <Award className="mr-1 h-3 w-3 text-amber-500" />
                              {c.name}
                              <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
                            </Badge>
                          </a>
                        ) : (
                          <Badge key={i} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700">
                            <Award className="mr-1 h-3 w-3 text-amber-500" />
                            {c.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience Section */}
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/30 px-3 py-2.5">
                <SectionHeader
                  icon={Briefcase}
                  label="Work Experience"
                  color="text-violet-600 dark:text-violet-400"
                  borderColor="border-violet-200 dark:border-violet-800"
                />
                <div className="mt-2 space-y-1.5">
                  {(profile.itExperienceYears > 0 ||
                    profile.itExperienceMonths > 0) && (
                    <ExperienceRow
                      label="IT Experience"
                      years={profile.itExperienceYears}
                      months={profile.itExperienceMonths}
                      color="border-violet-200 dark:border-violet-800 bg-white/60 dark:bg-violet-900/20"
                    />
                  )}
                  {(profile.nonItExperienceYears > 0 ||
                    profile.nonItExperienceMonths > 0) && (
                    <ExperienceRow
                      label="Non-IT Experience"
                      years={profile.nonItExperienceYears}
                      months={profile.nonItExperienceMonths}
                      color="border-violet-200 dark:border-violet-800 bg-white/60 dark:bg-violet-900/20"
                    />
                  )}
                  {profile.lastWorkedYear && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-muted-foreground">
                        Last worked in
                      </span>
                      <span className="font-medium">
                        {profile.lastWorkedYear}
                      </span>
                    </div>
                  )}
                  {profile.employmentStatus === "FRESHER" &&
                    profile.itExperienceYears === 0 &&
                    profile.nonItExperienceYears === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No prior work experience
                      </p>
                    )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            No profile data found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactRow({
  icon: Icon,
  value,
  color = "bg-muted text-muted-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-3 w-3" />
      </div>
      <span className="truncate">{value}</span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  color = "text-primary",
  borderColor = "border-border",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color?: string;
  borderColor?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 border-b ${borderColor} pb-1.5`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
    </div>
  );
}

function EducationCard({
  degree,
  year,
  dotColor = "bg-muted-foreground/40",
}: {
  degree: string;
  year?: string;
  dotColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white/60 dark:bg-emerald-900/20 px-2.5 py-1.5">
      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
      <p className="text-sm font-medium leading-tight">{degree}</p>
      {year && (
        <p className="text-xs text-muted-foreground ml-auto shrink-0">{year}</p>
      )}
    </div>
  );
}

function ExperienceRow({
  label,
  years,
  months,
  color = "border bg-card",
}: {
  label: string;
  years: number;
  months: number;
  color?: string;
}) {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`);

  return (
    <div className={`flex items-center justify-between rounded-md border ${color} px-2.5 py-1.5`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{parts.join(" ") || "-"}</span>
    </div>
  );
}
