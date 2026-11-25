import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  enquirySchema,
  type EnquiryFormValues,
} from "../schemas/enquiry.schema";
import { todayStr } from "@/utils/format";
import {
  INSTITUTES,
  LEAD_STATUSES,
  DEMO_STATUSES,
  ENQUIRY_TYPES,
} from "@/constants/courses";
import type { Enquiry } from "@/types/admin.types";

const FORM_SELECTS = [
  {
    name: "institute" as const,
    label: "Institute",
    options: INSTITUTES.map((i) => ({ value: i, label: i })),
  },
  {
    name: "enquiryType" as const,
    label: "Enquiry Type",
    options: ENQUIRY_TYPES.map((t) => ({ ...t })),
  },
  {
    name: "leadStatus" as const,
    label: "Lead Status",
    options: LEAD_STATUSES.map((s) => ({ ...s })),
  },
  {
    name: "demoStatus" as const,
    label: "Demo Status",
    options: DEMO_STATUSES.map((s) => ({ ...s })),
  },
];

function emptyValues(): EnquiryFormValues {
  return {
    enquiry_date: todayStr(),
    institute: "TECHVAA",
    enquiryType: "WALKIN",
    leadStatus: "NEW",
    demoStatus: "PENDING",
  } as EnquiryFormValues;
}

function enquiryToValues(enquiry: Enquiry): EnquiryFormValues {
  const raw = enquiry as unknown as Record<string, string>;
  return {
    enquiry_date: (raw.enquiry_date ?? "").split("T")[0],
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email ?? "",
    course: enquiry.course ?? "",
    institute: enquiry.institute,
    enquiryType: (raw.enquiry_type ??
      enquiry.enquiry_type ??
      "WALKIN") as EnquiryFormValues["enquiryType"],
    leadStatus: (raw.lead_status ??
      enquiry.leadStatus) as EnquiryFormValues["leadStatus"],
    demoStatus: (raw.demo_status ??
      enquiry.demoStatus) as EnquiryFormValues["demoStatus"],
    demo_date: (raw.demo_date ?? enquiry.demo_date ?? "").split("T")[0],
    comment: enquiry.comment ?? "",
  };
}

interface EnquiryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The enquiry being edited, or null to create a new one */
  enquiry: Enquiry | null;
  /** Master ENQUIRY course names */
  courseOptions: string[];
  coursesLoading: boolean;
  onSubmit: (values: EnquiryFormValues) => void;
  isPending: boolean;
}

/**
 * Create / edit enquiry dialog. The form state lives here (not in the page),
 * so typing or picking a value only re-renders this dialog, never the
 * enquiry table behind it.
 */
export function EnquiryFormDialog({
  open,
  onOpenChange,
  enquiry,
  courseOptions,
  coursesLoading,
  onSubmit,
  isPending,
}: EnquiryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{enquiry ? "Edit Enquiry" : "Add Enquiry"}</DialogTitle>
        </DialogHeader>
        {/* DialogContent unmounts when closed, so the form mounts fresh with
            the right values on every open — no reset-after-paint flash. */}
        <EnquiryForm
          key={enquiry?.id ?? "new"}
          enquiry={enquiry}
          courseOptions={courseOptions}
          coursesLoading={coursesLoading}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EnquiryFormProps {
  enquiry: Enquiry | null;
  courseOptions: string[];
  coursesLoading: boolean;
  onSubmit: (values: EnquiryFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}

function EnquiryForm({
  enquiry,
  courseOptions,
  coursesLoading,
  onSubmit,
  onCancel,
  isPending,
}: EnquiryFormProps) {
  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: enquiry ? enquiryToValues(enquiry) : emptyValues(),
  });

  // The dropdown is select-only, so an enquiry saved before the master list
  // existed would show blank and lose its course on the next save. Append the
  // record's own value when it is missing rather than adding it to the master
  // list, which stays managed from Course Management.
  const formCourseOptions = useMemo(() => {
    const current = enquiry?.course?.trim();
    return current && !courseOptions.includes(current)
      ? [...courseOptions, current]
      : courseOptions;
  }, [courseOptions, enquiry?.course]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit(onSubmit)(e);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" {...form.register("enquiry_date")} />
        </div>
        <div className="space-y-1">
          <Label>Name *</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Phone *</Label>
          <Input
            maxLength={10}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
            }}
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Course</Label>
          <Select
            value={form.watch("course") || ""}
            onValueChange={(v) => form.setValue("course", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {coursesLoading ? (
                <SelectItem value="__loading" disabled>
                  Loading...
                </SelectItem>
              ) : formCourseOptions.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  No courses available
                </SelectItem>
              ) : (
                formCourseOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Comment</Label>
          <Textarea
            {...form.register("comment")}
            rows={3}
            placeholder="Enter comment (press Enter to add a follow-up on a new line)"
          />
        </div>
        {FORM_SELECTS.map(({ name, label, options }) => (
          <div key={name} className="space-y-1">
            <Label>{label}</Label>
            <Select
              value={form.watch(name) ?? ""}
              onValueChange={(v) => {
                form.setValue(name, v as never);
                if (
                  name === "demoStatus" &&
                  v === "DONE" &&
                  !form.getValues("demo_date")
                ) {
                  form.setValue("demo_date", todayStr());
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="space-y-1">
          <Label>Demo Date</Label>
          <Input type="date" {...form.register("demo_date")} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {enquiry
            ? isPending
              ? "Updating..."
              : "Update"
            : isPending
              ? "Creating..."
              : "Create"}
        </Button>
      </div>
    </form>
  );
}
