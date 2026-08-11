import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  createLineItem,
  createParticipant,
  recalculateReceipt,
  recalculateSessionTotal,
} from '@/lib/session-helpers';
import {
  getClaimedQuantity,
  getMaxClaimQuantity,
  type LineItem,
} from '@/models/LineItem';
import type { SplitSession } from '@/models/SplitSession';

type SplitContextValue = {
  session: SplitSession | null;
  setSession: (session: SplitSession) => void;
  updateSession: (updater: (session: SplitSession) => SplitSession) => void;
  updateLineItem: (itemId: string, updates: Partial<LineItem>) => void;
  addLineItem: () => void;
  removeLineItem: (itemId: string) => void;
  addParticipant: (name: string) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantName: (participantId: string, name: string) => void;
  toggleItemClaim: (itemId: string, personId: string) => void;
  adjustItemClaimQuantity: (itemId: string, personId: string, delta: number) => void;
  updateReceiptField: (field: 'tax' | 'fees' | 'merchantName', value: string | number) => void;
  updateTipSettings: (tipMode: SplitSession['tipMode'], tipValue: number) => void;
  clearSession: () => void;
};

const SplitContext = createContext<SplitContextValue | null>(null);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SplitSession | null>(null);

  const setSession = useCallback((nextSession: SplitSession) => {
    setSessionState(recalculateSessionTotal(nextSession));
  }, []);

  const updateSession = useCallback((updater: (session: SplitSession) => SplitSession) => {
    setSessionState((current) => {
      if (!current) {
        return current;
      }
      return recalculateSessionTotal(updater(current));
    });
  }, []);

  const updateLineItem = useCallback((itemId: string, updates: Partial<LineItem>) => {
    updateSession((current) => {
      const lineItems = current.receipt.lineItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextItem = { ...item, ...updates };
        const quantity = nextItem.quantity;
        const unitPrice = nextItem.unitPrice;
        nextItem.lineTotal = Math.round(quantity * unitPrice * 100) / 100;

        // Clamp existing claims if quantity was reduced.
        const claimedBy: Record<string, number> = {};
        let remaining = quantity;
        for (const [personId, claimedQuantity] of Object.entries(nextItem.claimedBy)) {
          if (claimedQuantity <= 0 || remaining <= 0) {
            continue;
          }
          const nextQuantity = Math.min(claimedQuantity, remaining);
          claimedBy[personId] = nextQuantity;
          remaining -= nextQuantity;
        }
        nextItem.claimedBy = claimedBy;

        return nextItem;
      });

      return {
        ...current,
        receipt: recalculateReceipt({ ...current.receipt, lineItems }, current),
      };
    });
  }, [updateSession]);

  const addLineItem = useCallback(() => {
    updateSession((current) => ({
      ...current,
      receipt: recalculateReceipt(
        {
          ...current.receipt,
          lineItems: [
            ...current.receipt.lineItems,
            createLineItem({ name: `Item ${current.receipt.lineItems.length + 1}` }),
          ],
        },
        current,
      ),
    }));
  }, [updateSession]);

  const removeLineItem = useCallback(
    (itemId: string) => {
      updateSession((current) => ({
        ...current,
        receipt: recalculateReceipt(
          {
            ...current.receipt,
            lineItems: current.receipt.lineItems.filter((item) => item.id !== itemId),
          },
          current,
        ),
      }));
    },
    [updateSession],
  );

  const addParticipant = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      updateSession((current) => ({
        ...current,
        participants: [...current.participants, createParticipant(trimmed)],
      }));
    },
    [updateSession],
  );

  const removeParticipant = useCallback(
    (participantId: string) => {
      updateSession((current) => {
        if (current.participants.length <= 1) {
          return current;
        }

        const lineItems = current.receipt.lineItems.map((item) => {
          const { [participantId]: _removed, ...claimedBy } = item.claimedBy;
          return { ...item, claimedBy };
        });

        return {
          ...current,
          participants: current.participants.filter((participant) => participant.id !== participantId),
          receipt: { ...current.receipt, lineItems },
        };
      });
    },
    [updateSession],
  );

  const updateParticipantName = useCallback(
    (participantId: string, name: string) => {
      updateSession((current) => ({
        ...current,
        participants: current.participants.map((participant) =>
          participant.id === participantId ? { ...participant, name } : participant,
        ),
      }));
    },
    [updateSession],
  );

  const toggleItemClaim = useCallback(
    (itemId: string, personId: string) => {
      updateSession((current) => {
        const lineItems = current.receipt.lineItems.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const isClaimed = getClaimedQuantity(item, personId) > 0;
          const claimedBy = { ...item.claimedBy };

          if (isClaimed) {
            delete claimedBy[personId];
          } else {
            claimedBy[personId] = 1;
          }

          return { ...item, claimedBy };
        });

        return { ...current, receipt: { ...current.receipt, lineItems } };
      });
    },
    [updateSession],
  );

  const adjustItemClaimQuantity = useCallback(
    (itemId: string, personId: string, delta: number) => {
      updateSession((current) => {
        const lineItems = current.receipt.lineItems.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const currentQuantity = getClaimedQuantity(item, personId);
          const maxQuantity = getMaxClaimQuantity(item, personId);
          const nextQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + delta));
          const claimedBy = { ...item.claimedBy };

          if (nextQuantity <= 0) {
            delete claimedBy[personId];
          } else {
            claimedBy[personId] = nextQuantity;
          }

          return { ...item, claimedBy };
        });

        return { ...current, receipt: { ...current.receipt, lineItems } };
      });
    },
    [updateSession],
  );

  const updateReceiptField = useCallback(
    (field: 'tax' | 'fees' | 'merchantName', value: string | number) => {
      updateSession((current) => ({
        ...current,
        receipt: recalculateReceipt(
          {
            ...current.receipt,
            [field]: value,
          },
          current,
        ),
      }));
    },
    [updateSession],
  );

  const updateTipSettings = useCallback(
    (tipMode: SplitSession['tipMode'], tipValue: number) => {
      updateSession((current) => ({
        ...current,
        tipMode,
        tipValue,
      }));
    },
    [updateSession],
  );

  const clearSession = useCallback(() => {
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      setSession,
      updateSession,
      updateLineItem,
      addLineItem,
      removeLineItem,
      addParticipant,
      removeParticipant,
      updateParticipantName,
      toggleItemClaim,
      adjustItemClaimQuantity,
      updateReceiptField,
      updateTipSettings,
      clearSession,
    }),
    [
      session,
      setSession,
      updateSession,
      updateLineItem,
      addLineItem,
      removeLineItem,
      addParticipant,
      removeParticipant,
      updateParticipantName,
      toggleItemClaim,
      adjustItemClaimQuantity,
      updateReceiptField,
      updateTipSettings,
      clearSession,
    ],
  );

  return <SplitContext.Provider value={value}>{children}</SplitContext.Provider>;
}

export function useSplitContext() {
  const context = useContext(SplitContext);
  if (!context) {
    throw new Error('useSplitContext must be used within SplitProvider');
  }
  return context;
}

export function useRequiredSession() {
  return useSplitContext().session;
}
