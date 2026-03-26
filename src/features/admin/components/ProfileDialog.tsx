import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  Shield,
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
import { adminService } from "@/services/admin.service";
import type { ApprovalState, EmploymentStatus } from "@/types/common.types";

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

function approvalBadgeVariant(state: ApprovalState) {
  switch (state) {
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
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
    queryKey: ["admin", "student-profile", studentId],
    queryFn: () => adminService.getStudentProfile(studentId),
    enabled: open && !!studentId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
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
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary/8 to-background px-6 pt-8 pb-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  {profile.profilePhoto && (
                    <AvatarImage src={profile.profilePhoto} alt={profile.name} />
                  )}
                  <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg font-bold">{profile.name}</h2>
                {profile.course && (
                  <p className="text-sm text-muted-foreground">
                    {profile.course}
                    {profile.batch && ` - ${profile.batch}`}
                  </p>
                )}
                {profile.approvalState && (
                  <Badge
                    variant={approvalBadgeVariant(profile.approvalState)}
                    className="mt-2"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {profile.approvalState.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2.5 px-6 py-4">
              <ContactRow icon={Mail} value={profile.email} />
              <ContactRow icon={Phone} value={profile.phone} />
              {(profile.city || profile.area) && (
                <ContactRow
                  icon={MapPin}
                  value={[profile.city, profile.area]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
              <ContactRow
                icon={Briefcase}
                value={employmentLabel(profile.employmentStatus)}
              />
            </div>

            {/* Education */}
            <div className="px-6 pb-4">
              <SectionHeader icon={GraduationCap} label="Education Background" />
              <div className="mt-3 space-y-3">
                {profile.graduation && (
                  <EducationCard
                    degree={profile.graduation}
                    year={profile.graduationYear?.toString()}
                  />
                )}
                {profile.postGraduation && (
                  <EducationCard
                    degree={profile.postGraduation}
                    year={profile.pgYear?.toString()}
                    highlight
                  />
                )}
                {profile.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Award className="mr-1 h-3 w-3 text-amber-500" />
                        {typeof cert === "string" ? cert : cert.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Work Experience */}
            <div className="px-6 pb-6">
              <SectionHeader icon={Briefcase} label="Work Experience" />
              <div className="mt-3 space-y-2.5">
                {(profile.itExperienceYears > 0 ||
                  profile.itExperienceMonths > 0) && (
                  <ExperienceRow
                    label="IT Experience"
                    years={profile.itExperienceYears}
                    months={profile.itExperienceMonths}
                  />
                )}
                {(profile.nonItExperienceYears > 0 ||
                  profile.nonItExperienceMonths > 0) && (
                  <ExperienceRow
                    label="Non-IT Experience"
                    years={profile.nonItExperienceYears}
                    months={profile.nonItExperienceMonths}
                  />
                )}
                {profile.lastWorkedYear && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ContactRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="truncate">{value}</span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function EducationCard({
  degree,
  year,
  highlight,
}: {
  degree: string;
  year?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div
        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
          highlight ? "bg-primary" : "bg-muted-foreground/40"
        }`}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{degree}</p>
        {year && (
          <p className="text-xs text-muted-foreground mt-0.5">{year}</p>
        )}
      </div>
    </div>
  );
}

function ExperienceRow({
  label,
  years,
  months,
}: {
  label: string;
  years: number;
  months: number;
}) {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`);

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{parts.join(" ") || "-"}</span>
    </div>
  );
}
