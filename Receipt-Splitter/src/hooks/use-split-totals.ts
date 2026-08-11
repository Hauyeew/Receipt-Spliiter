import { useMemo } from 'react';

import { computeAllTotals, computePersonBreakdown } from '@/lib/split-calculator';
import type { SplitSession } from '@/models/SplitSession';

export function useSplitTotals(session: SplitSession | null) {
  return useMemo(() => (session ? computeAllTotals(session) : []), [session]);
}

export function usePersonTotal(session: SplitSession | null, personId: string) {
  return useMemo(
    () =>
      session
        ? computePersonBreakdown(session, personId)
        : { personId, food: 0, tax: 0, tip: 0, fees: 0, total: 0 },
    [session, personId],
  );
}
