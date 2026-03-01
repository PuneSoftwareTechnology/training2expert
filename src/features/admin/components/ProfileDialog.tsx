import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminService } from "@/services/admin.service";

interface ProfileDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : profile ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <ProfileField label="Name" value={profile.name} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Phone" value={profile.phone} />
              <ProfileField label="City" value={profile.city ?? "-"} />
              <ProfileField label="Area" value={profile.area ?? "-"} />

              <Separator />
              <p className="text-sm font-semibold">Education</p>
              <ProfileField
                label="Graduation"
                value={profile.graduation ?? "-"}
              />
              <ProfileField
                label="Graduation Year"
                value={profile.graduationYear?.toString() ?? "-"}
              />
              <ProfileField
                label="Post Graduation"
                value={profile.postGraduation ?? "-"}
              />
              <ProfileField
                label="PG Year"
                value={profile.pgYear?.toString() ?? "-"}
              />
              <ProfileField
                label="Certifications"
                value={
                  profile.certifications.length > 0
                    ? profile.certifications.join(", ")
                    : "-"
                }
              />

              <Separator />
              <p className="text-sm font-semibold">Experience</p>
              <ProfileField
                label="Employment Status"
                value={profile.employmentStatus}
              />
              <ProfileField
                label="IT Experience"
                value={`${profile.itExperienceYears} yrs ${profile.itExperienceMonths} mos`}
              />
              <ProfileField
                label="Non-IT Experience"
                value={`${profile.nonItExperienceYears} yrs ${profile.nonItExperienceMonths} mos`}
              />
              {profile.lastWorkedYear && (
                <ProfileField
                  label="Last Worked Year"
                  value={profile.lastWorkedYear.toString()}
                />
              )}

              <Separator />
              <ProfileField
                label="Approval State"
                value={profile.approvalState}
              />
            </div>
          </ScrollArea>
        ) : (
          <p className="py-4 text-center text-muted-foreground">
            No profile data found
          </p>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
