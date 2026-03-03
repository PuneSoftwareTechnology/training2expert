import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode, Landmark, AtSign, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { qrSchema, type QrFormValues } from "../schemas/qr.schema";
import { superAdminService } from "@/services/super-admin.service";
import { getErrorMessage } from "@/services/api";

interface AddQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryKey: string[];
}

export function AddQrDialog({ open, onOpenChange, queryKey }: AddQrDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QrFormValues>({
    resolver: zodResolver(qrSchema),
    defaultValues: {
      bank_name: "",
      branch: "",
      upi_id: "",
      account_number: "",
      ifsc_code: "",
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: QrFormValues) => {
      if (!selectedFile) throw new Error("QR image is required");
      return superAdminService.createQrCode(selectedFile, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
      setSelectedFile(null);
      form.reset();
      toast.success("QR code created successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = (data: QrFormValues) => {
    if (!selectedFile) {
      toast.error("Please upload a QR image");
      return;
    }
    createMutation.mutate(data);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG and PNG files are supported");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedFile(null);
      form.reset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add/Edit QR Details</DialogTitle>
          <DialogDescription>
            Enter the bank and UPI details for student payment collection.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          {/* Bank Name */}
          <div className="space-y-1.5">
            <Label>Bank Name*</Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="e.g. HDFC Bank"
                className="pl-9"
                {...form.register("bank_name")}
              />
            </div>
            {form.formState.errors.bank_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.bank_name.message}
              </p>
            )}
          </div>

          {/* UPI ID */}
          <div className="space-y-1.5">
            <Label>UPI ID*</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="e.g. schoolname@upi"
                className="pl-9"
                {...form.register("upi_id")}
              />
            </div>
            {form.formState.errors.upi_id && (
              <p className="text-xs text-destructive">
                {form.formState.errors.upi_id.message}
              </p>
            )}
          </div>

          {/* Account Number & IFSC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Number*</Label>
              <Input
                placeholder="Enter account number"
                {...form.register("account_number")}
              />
              {form.formState.errors.account_number && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.account_number.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code*</Label>
              <Input
                placeholder="Enter IFSC code"
                {...form.register("ifsc_code")}
              />
              {form.formState.errors.ifsc_code && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ifsc_code.message}
                </p>
              )}
            </div>
          </div>

          {/* Upload QR Image */}
          <div className="space-y-1.5">
            <Label>Upload QR Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <div
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <QrCode className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Click to change
                  </p>
                </div>
              ) : (
                <>
                  <QrCode className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drag and drop QR image</p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG (Max 2MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Set as Active */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Set as Active</p>
              <p className="text-xs text-muted-foreground">
                This will make this QR visible to students immediately
              </p>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(checked) => form.setValue("is_active", checked)}
            />
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {createMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save QR Details
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
