import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { INSTITUTES } from "@/constants/courses";
import type {
  Institute,
  Enrollment,
  EnrollmentStatus,
} from "@/types/student.types";

interface NewCandidateFields {
  name: string;
  email: string;
  phone: string;
  institute: Institute;
  course: string;
  batch: string;
  trainer: string;
  start_date: string;
  end_date: string;
  total_fee: number;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const NEW_CANDIDATE_DEFAULTS: NewCandidateFields = {
  name: "",
  email: "",
  phone: "",
  institute: "PST",
  course: "",
  batch: "",
  trainer: "",
  start_date: todayStr(),
  end_date: "",
  total_fee: 0,
};

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Enrollment>) => void;
  isPending: boolean;
}

export function AddCandidateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AddCandidateDialogProps) {
  const [newCandidate, setNewCandidate] = useState<NewCandidateFields>(
    NEW_CANDIDATE_DEFAULTS,
  );

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const updateNewField = useCallback(
    <K extends keyof NewCandidateFields>(
      key: K,
      value: NewCandidateFields[K],
    ) => {
      setNewCandidate((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = () => {
    if (!newCandidate.name || !newCandidate.email || !newCandidate.phone) {
      toast.error("Name, Email, and Phone are required.");
      return;
    }
    if (!isValidEmail(newCandidate.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (newCandidate.phone.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    onSubmit({
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      institute: newCandidate.institute,
      course: newCandidate.course,
      batch: newCandidate.batch,
      trainer: newCandidate.trainer,
      start_date: newCandidate.start_date,
      end_date: newCandidate.end_date,
      total_fee: newCandidate.total_fee,
    } as Partial<Enrollment>);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setNewCandidate(NEW_CANDIDATE_DEFAULTS);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              value={newCandidate.name}
              onChange={(e) => updateNewField("name", e.target.value)}
            />
            {newCandidate.name !== undefined &&
              newCandidate.name.length === 0 && (
                <p className="text-xs text-destructive">Name is required</p>
              )}
          </div>
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              value={newCandidate.email}
              onChange={(e) => updateNewField("email", e.target.value)}
            />
            {newCandidate.email.length > 0 &&
              !isValidEmail(newCandidate.email) && (
                <p className="text-xs text-destructive">
                  Invalid email address
                </p>
              )}
          </div>
          <div className="space-y-1">
            <Label>Phone *</Label>
            <Input
              value={newCandidate.phone}
              maxLength={10}
              onChange={(e) =>
                updateNewField("phone", e.target.value.replace(/\D/g, ""))
              }
            />
            {newCandidate.phone.length > 0 &&
              newCandidate.phone.length < 10 && (
                <p className="text-xs text-destructive">
                  Phone must be 10 digits
                </p>
              )}
          </div>
          <div className="space-y-1">
            <Label>Institute</Label>
            <Select
              value={newCandidate.institute}
              onValueChange={(v) => updateNewField("institute", v as Institute)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Course</Label>
            <Input
              value={newCandidate.course}
              onChange={(e) => updateNewField("course", e.target.value)}
              placeholder="Enter course"
            />
          </div>
          <div className="space-y-1">
            <Label>Batch</Label>
            <Input
              value={newCandidate.batch}
              onChange={(e) => updateNewField("batch", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Trainer</Label>
            <Input
              value={newCandidate.trainer}
              onChange={(e) => updateNewField("trainer", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={newCandidate.start_date}
              onChange={(e) => updateNewField("start_date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>End Date</Label>
            <Input
              type="date"
              value={newCandidate.end_date}
              onChange={(e) => updateNewField("end_date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Total Fees</Label>
            <Input
              type="number"
              value={newCandidate.total_fee || ""}
              onChange={(e) =>
                updateNewField("total_fee", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !newCandidate.name ||
              !newCandidate.email ||
              !isValidEmail(newCandidate.email) ||
              newCandidate.phone.length !== 10
            }
            loading={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
