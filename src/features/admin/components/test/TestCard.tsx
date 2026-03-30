import {
  Pencil,
  Power,
  Users,
  Trash2,
  BookOpen,
  Clock,
  HelpCircle,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Test } from "@/types/common.types";

interface TestCardProps {
  test: Test;
  onView: (testId: string) => void;
  onEdit: (testId: string) => void;
  onViewAttempts: (testId: string, testTitle: string) => void;
  onTogglePublish: (testId: string) => void;
  onDelete: (testId: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

export function TestCard({
  test,
  onView,
  onEdit,
  onViewAttempts,
  onTogglePublish,
  onDelete,
  isToggling,
  isDeleting,
}: TestCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/50"
      onClick={() => onView(test.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{test.title}</CardTitle>
            {test.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {test.description}
              </p>
            )}
          </div>
          <Badge
            variant={test.isPublished ? "success" : "secondary"}
            className="shrink-0"
          >
            {test.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            <BookOpen className="h-3 w-3" />
            {test.course || "—"}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            {test.durationMinutes} min
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
            <HelpCircle className="h-3 w-3" />
            {test.questionCount ?? test.questions?.length ?? 0} Q's
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Award className="h-3 w-3" />
            {test.totalMarks} marks
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(test.id)}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant={test.isPublished ? "secondary" : "default"}
            size="sm"
            onClick={() => onTogglePublish(test.id)}
            loading={isToggling}
            className={`gap-1.5 ${!test.isPublished ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700" : ""}`}
          >
            {!isToggling && <Power className="h-3.5 w-3.5" />}
            {test.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAttempts(test.id, test.title)}
            className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
          >
            <Users className="h-3.5 w-3.5" /> Attempts
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(test.id)}
            loading={isDeleting}
            className="ml-auto h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {!isDeleting && <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
