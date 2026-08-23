import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { adminService } from "@/services/admin.service";

/**
 * Batch names already in use on enrollments. Batches have no master list — they
 * are typed in free-form — so the existing values are offered as suggestions
 * only, keeping spellings consistent without blocking a brand new batch.
 */
export function useBatchOptions(currentValue?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "enrollment-batches"],
    queryFn: () => adminService.getBatches(),
  });

  const options = useMemo(() => {
    const names = (data ?? [])
      .map((b) => b?.trim())
      .filter((b): b is string => !!b);
    const current = currentValue?.trim();
    return current && !names.includes(current) ? [...names, current] : names;
  }, [data, currentValue]);

  return { options, isLoading };
}
