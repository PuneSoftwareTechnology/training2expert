import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { adminService } from "@/services/admin.service";
import type { CourseType } from "@/types/common.types";

/**
 * Active master course names for a given module's list, managed from the
 * Course Management page. `currentValue` is appended when it is not part of the
 * list so editing an older record cannot silently drop its course.
 */
export function useCourseOptions(type: CourseType, currentValue?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "master-courses", type],
    queryFn: () => adminService.getMasterCourses(true, type),
  });

  const options = useMemo(() => {
    const names = (data ?? []).map((c) => c.name);
    const current = currentValue?.trim();
    return current && !names.includes(current) ? [...names, current] : names;
  }, [data, currentValue]);

  return { options, isLoading };
}
