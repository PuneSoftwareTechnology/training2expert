import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Pencil, Trash2, UserCog, Merge } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { trainerService } from "@/services/trainer.service";
import { getErrorMessage } from "@/services/api";
import { normalizeTrainerName } from "@/utils/trainer";
import { ROUTES } from "@/constants/routes";
import type { TrainerWithStats } from "@/types/trainer.types";
import type { TrainerFormValues } from "../schemas/trainer.schema";

import { AddTrainerDialog } from "../components/AddTrainerDialog";
import { MergeTrainersDialog } from "../components/MergeTrainersDialog";

const QUERY_KEY = ["super-admin", "trainers"];

function CourseBadges({ courses }: { courses: string[] }) {
  if (!courses || courses.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {courses.map((c) => (
        <Badge key={c} variant="secondary" className="text-xs font-normal">
          {c}
        </Badge>
      ))}
    </div>
  );
}

export default function TrainersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainerWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainerWithStats | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => trainerService.getTrainersWithStats(),
  });

  /** Anything that reads a trainer name or the dropdown has to refresh too. */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["admin", "trainers"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "trainer-payouts"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
  };

  const createMutation = useMutation({
    mutationFn: ({
      values,
      confirmDuplicate,
    }: {
      values: TrainerFormValues;
      confirmDuplicate: boolean;
    }) =>
      trainerService.createTrainer({
        name: values.name,
        courses: values.courses,
        note: values.note || null,
        isActive: values.isActive,
        confirmDuplicate,
      }),
    onSuccess: (trainer) => {
      invalidateAll();
      setDialogOpen(false);
      toast.success(`Trainer created as ${trainer.code}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TrainerFormValues }) =>
      trainerService.updateTrainer(id, {
        name: values.name,
        courses: values.courses,
        note: values.note || null,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      invalidateAll();
      setDialogOpen(false);
      setEditing(null);
      toast.success("Trainer updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: trainerService.deleteTrainer,
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
      toast.success("Trainer deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const mergeMutation = useMutation({
    mutationFn: ({
      survivorId,
      loserIds,
    }: {
      survivorId: string;
      loserIds: string[];
    }) => trainerService.mergeTrainers(survivorId, loserIds),
    onSuccess: (result) => {
      invalidateAll();
      setMergeOpen(false);
      setSelectedIds([]);
      toast.success(
        `Merged into ${result.survivor.name} — ${result.enrollmentsMoved} enrollment(s) moved`,
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const trainers = data ?? [];

  /** Names shared by more than one record — the merge candidates. */
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of trainers) {
      const key = normalizeTrainerName(t.name);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set(
      [...counts.entries()].filter(([, n]) => n > 1).map(([key]) => key),
    );
  }, [trainers]);

  const filtered = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const rows = term
      ? trainers.filter(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            t.code.toLowerCase().includes(term),
        )
      : trainers;

    // Shared names float to the top so the post-migration cleanup is a couple
    // of minutes of clicking rather than an audit.
    return [...rows].sort((a, b) => {
      const aDup = duplicateNames.has(normalizeTrainerName(a.name));
      const bDup = duplicateNames.has(normalizeTrainerName(b.name));
      if (aDup !== bDup) return aDup ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [trainers, searchText, duplicateNames]);

  const selected = useMemo(
    () => trainers.filter((t) => selectedIds.includes(t.id)),
    [trainers, selectedIds],
  );

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (trainer: TrainerWithStats) => {
    setEditing(trainer);
    setDialogOpen(true);
  };

  const columns: ColumnDef<TrainerWithStats>[] = [
    {
      id: "select",
      header: () => <span className="sr-only">Select</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          onCheckedChange={() => toggleSelected(row.original.id)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Trainer" />,
      cell: ({ row }) => {
        const t = row.original;
        const isDuplicate = duplicateNames.has(normalizeTrainerName(t.name));
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.name}</span>
              {isDuplicate && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-[10px] text-amber-700"
                >
                  shared name
                </Badge>
              )}
            </div>
            {t.note && (
              <p className="text-xs text-muted-foreground">{t.note}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "courses",
      header: "Hired For",
      enableSorting: false,
      cell: ({ getValue }) => <CourseBadges courses={getValue<string[]>()} />,
    },
    {
      accessorKey: "teachingCourses",
      header: "Currently Teaching",
      enableSorting: false,
      cell: ({ getValue }) => <CourseBadges courses={getValue<string[]>()} />,
    },
    {
      accessorKey: "enrollmentCount",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Students" />
        </div>
      ),
      cell: ({ row }) => {
        const t = row.original;
        if (t.enrollmentCount === 0) {
          return <span className="block text-right text-muted-foreground">0</span>;
        }
        return (
          <Link
            to={`${ROUTES.ADMIN_TRAINER_PAYMENTS}?trainerId=${t.id}`}
            className="block text-right font-medium text-blue-600 hover:underline"
          >
            {t.enrollmentCount}
          </Link>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-md shadow-amber-200/50">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trainers</h2>
              <p className="text-sm text-muted-foreground">
                Trainers available on the enrollment form. Only super admins can
                add or edit them.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FilterActions onRefresh={() => refetch()} isFetching={isFetching} />
            {selectedIds.length > 1 && (
              <Button variant="outline" onClick={() => setMergeOpen(true)}>
                <Merge className="mr-2 h-4 w-4" />
                Merge {selectedIds.length}
              </Button>
            )}
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200/50 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Trainer
            </Button>
          </div>
        </div>

        <Card className="border-amber-200/60 bg-gradient-to-r from-amber-100 to-orange-200">
          <CardContent className="pb-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="self-end pb-1.5 text-sm font-semibold whitespace-nowrap">
                Total: {filtered.length} trainers
              </span>
              {duplicateNames.size > 0 && (
                <span className="self-end pb-1.5 text-xs text-amber-800">
                  {duplicateNames.size} name
                  {duplicateNames.size === 1 ? " is" : "s are"} shared by more
                  than one record — tick two and merge if they are the same
                  person.
                </span>
              )}
              <div className="ml-auto space-y-1">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or code..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-56 bg-white pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : (
          <Card className="overflow-hidden border-amber-200/60">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filtered}
                pageSize={filtered.length || 1}
                emptyMessage="No trainers yet. Add one to make it selectable on the enrollment form."
                headerClassName="bg-gradient-to-r from-amber-500 to-orange-600"
              />
            </CardContent>
          </Card>
        )}

        <AddTrainerDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          existingTrainers={trainers}
          isPending={createMutation.isPending || updateMutation.isPending}
          onSubmit={(values, confirmDuplicate) =>
            editing
              ? updateMutation.mutate({ id: editing.id, values })
              : createMutation.mutate({ values, confirmDuplicate })
          }
        />

        <MergeTrainersDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          selected={selected}
          isPending={mergeMutation.isPending}
          onSubmit={(survivorId, loserIds) =>
            mergeMutation.mutate({ survivorId, loserIds })
          }
        />

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trainer?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && deleteTarget.enrollmentCount > 0 ? (
                  <>
                    {deleteTarget.name} is assigned to{" "}
                    {deleteTarget.enrollmentCount} enrollment
                    {deleteTarget.enrollmentCount === 1 ? "" : "s"}, so deleting
                    them would orphan their payment history. Deactivate them
                    instead to take them out of the dropdown, or merge them into
                    another trainer.
                  </>
                ) : (
                  <>
                    This permanently deletes {deleteTarget?.name} (
                    {deleteTarget?.code}). They have no enrollments, so no
                    payment history is affected.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  deleteTarget && deleteMutation.mutate(deleteTarget.id)
                }
                disabled={
                  deleteMutation.isPending ||
                  (deleteTarget?.enrollmentCount ?? 0) > 0
                }
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
