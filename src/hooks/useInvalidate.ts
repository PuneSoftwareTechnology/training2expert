import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidate() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient],
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return { invalidate, invalidateAll };
}
