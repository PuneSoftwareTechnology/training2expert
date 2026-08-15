import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import {
  courseSchema,
  type CourseFormValues,
} from "../schemas/course.schema";
import { superAdminService } from "@/services/super-admin.service";
import { getErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/format";
import { COURSE_TYPES } from "@/constants/courses";
import type { CourseType } from "@/types/common.types";
import type { Course } from "@/types/super-admin.types";

const QUERY_KEY = ["super-admin", "courses"];

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [courseType, setCourseType] = useState<CourseType>("ENQUIRY");

  const typeLabel =
    COURSE_TYPES.find((t) => t.value === courseType)?.label ?? courseType;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY, courseType],
    queryFn: () => superAdminService.getCourses({ type: courseType }),
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { name: "", type: "ENQUIRY", isActive: true },
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    // Keep the enquiry/enrollment course dropdowns in sync with the master list.
    queryClient.invalidateQueries({ queryKey: ["admin", "master-courses"] });
    refetch();
    setDialogOpen(false);
    setEditing(null);
    form.reset({ name: "", type: courseType, isActive: true });
  };

  const createMutation = useMutation({
    mutationFn: superAdminService.createCourse,
    onSuccess: () => {
      invalidateAndClose();
      toast.success("Course created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    // The list a course belongs to is fixed at creation, so only name/status
    // are editable.
    mutationFn: ({ id, data }: { id: string; data: CourseFormValues }) =>
      superAdminService.updateCourse(id, {
        name: data.name,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      invalidateAndClose();
      toast.success("Course updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: superAdminService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin", "master-courses"] });
      toast.success("Course deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = (values: CourseFormValues) => {
    editing
      ? updateMutation.mutate({ id: editing.id, data: values })
      : createMutation.mutate(values);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", type: courseType, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    form.reset({
      name: course.name,
      type: course.course_type,
      isActive: course.is_active,
    });
    setDialogOpen(true);
  };

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (!searchText.trim()) return items;
    const term = searchText.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(term));
  }, [data, searchText]);

  const columns: ColumnDef<Course>[] = [
    {
      id: "sno",
      header: "S.No",
      cell: ({ row }) => (
        <span className="font-medium text-center">{row.index + 1}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Course" />,
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <SortableHeader column={column} title="Created" />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? formatDate(v) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => openEdit(c)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleteId(c.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-md shadow-emerald-200/50">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Course Management</h2>
              <p className="text-sm text-muted-foreground">
                Master course lists for the enquiry and enrollment dropdowns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions
              onRefresh={() => refetch()}
              isFetching={isFetching}
            />
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50 hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="mr-2" /> Add {typeLabel} Course
            </Button>
          </div>
        </div>

        {/* Course list selector */}
        <Tabs
          value={courseType}
          onValueChange={(v) => {
            setCourseType(v as CourseType);
            setSearchText("");
          }}
        >
          <TabsList>
            {COURSE_TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} Courses
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card className="border-emerald-200/60 bg-gradient-to-r from-emerald-100 to-teal-200">
          <CardContent className="pb-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="self-end pb-1.5 text-sm font-semibold mr-16 whitespace-nowrap">
                Total: {filtered.length} {typeLabel.toLowerCase()} courses
              </span>
              <div className="space-y-1">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search course..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-56 pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <Card className="border-emerald-200/60 overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filtered}
                pageSize={filtered.length || 1}
                emptyMessage="No courses found"
                headerClassName="bg-gradient-to-r from-emerald-500 to-teal-600"
              />
            </CardContent>
          </Card>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? `Edit ${typeLabel} Course`
                  : `Add ${typeLabel} Course`}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>Course Name *</Label>
                <Input
                  {...form.register("name")}
                  placeholder="e.g. SAP FI HANA"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm font-medium">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive courses won't appear in dropdowns
                  </p>
                </div>
                <Switch
                  checked={form.watch("isActive") ?? true}
                  onCheckedChange={(v) => form.setValue("isActive", v)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
                  {editing
                    ? updateMutation.isPending
                      ? "Updating..."
                      : "Update"
                    : createMutation.isPending
                      ? "Creating..."
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the course from the{" "}
                {typeLabel.toLowerCase()} list. Existing records already saved
                with this course name will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
