import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  createLineItem,
  createParticipant,
  recalculateReceipt,
  recalculateSessionTotal,
} from '@/lib/session-helpers';
import type { LineItem } from '@/models/LineItem';
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

        const lineItems = current.receipt.lineItems.map((item) => ({
          ...item,
          claimedBy: item.claimedBy.filter((id) => id !== participantId),
        }));

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

          const isClaimed = item.claimedBy.includes(personId);
          const claimedBy = isClaimed
            ? item.claimedBy.filter((id) => id !== personId)
            : [...item.claimedBy, personId];

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
  const { session } = useSplitContext();
  if (!session) {
    throw new Error('No active split session');
  }
  return session;
}
