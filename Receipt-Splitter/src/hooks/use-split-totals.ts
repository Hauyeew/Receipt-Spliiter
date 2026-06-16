import { useMemo } from 'react';

import { computeAllTotals, computePersonBreakdown } from '@/lib/split-calculator';
import type { SplitSession } from '@/models/SplitSession';

export function useSplitTotals(session: SplitSession) {
  return useMemo(() => computeAllTotals(session), [session]);
}

export function usePersonTotal(session: SplitSession, personId: string) {
  return useMemo(() => computePersonBreakdown(session, personId), [session, personId]);
}
