import { Lock } from "lucide-react";

export function ApprovalOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Waiting for Administrator Approval
        </p>
        <p className="text-xs text-muted-foreground/70">
          This section will be available once your account is approved.
        </p>
      </div>
    </div>
  );
}
