import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptRow,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useSplitContext } from '@/context/split-context';
import { useSplitTotals } from '@/hooks/use-split-totals';
import { validateSplit } from '@/lib/split-calculator';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, clearSession } = useSplitContext();
  const totals = useSplitTotals(session);
  const validation = session ? validateSplit(session) : null;

  if (!session || !validation) {
    return <Redirect href="/" />;
  }

  const activeSession = session;
  const activeValidation = validation;

  function handleDone() {
    clearSession();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/');
  }

  function handleEditSelections() {
    const firstParticipant = activeSession.participants[0];
    router.push(`/split/${id}/select/${firstParticipant.id}`);
  }

  return (
    <ScreenContainer
      variant="receipt"
      title="Split summary"
      subtitle={activeSession.receipt.merchantName ?? 'Here is what everyone owes.'}
      footer={
        <>
          <PrimaryButton label="Edit selections" variant="secondary" onPress={handleEditSelections} />
          <PrimaryButton label="Done" onPress={handleDone} />
        </>
      }>
      <ReceiptPaper>
        <ReceiptText center bold size="lg">
          {(activeSession.receipt.merchantName || 'RECEIPT SPLITTER').toUpperCase()}
        </ReceiptText>
        <ReceiptText center muted size="sm">
          SPLIT CHECK
        </ReceiptText>
        <ReceiptDivider />

        {!activeValidation.isValid ? (
          <View style={styles.warningBlock}>
            {activeValidation.unclaimedItems.length > 0 ? (
              <ReceiptText muted size="sm">
                {activeValidation.unclaimedItems.length} item(s) unclaimed ($
                {activeValidation.unclaimedTotal.toFixed(2)})
              </ReceiptText>
            ) : null}
            {Math.abs(activeValidation.difference) > 0.01 ? (
              <ReceiptText muted size="sm">
                Totals off by ${Math.abs(activeValidation.difference).toFixed(2)}
              </ReceiptText>
            ) : null}
            <ReceiptDivider />
          </View>
        ) : null}

        {totals.map((breakdown, index) => {
          const participant = activeSession.participants.find(
            (person) => person.id === breakdown.personId,
          );
          if (!participant) {
            return null;
          }

          return (
            <View key={breakdown.personId} style={styles.personBlock}>
              <ReceiptRow
                label={participant.name.toUpperCase()}
                value={`$${breakdown.total.toFixed(2)}`}
                bold
                size="xl"
              />
              <ReceiptRow label="  Food" value={`$${breakdown.food.toFixed(2)}`} size="sm" />
              <ReceiptRow label="  Tax" value={`$${breakdown.tax.toFixed(2)}`} size="sm" />
              <ReceiptRow label="  Tip" value={`$${breakdown.tip.toFixed(2)}`} size="sm" />
              {breakdown.fees > 0 ? (
                <ReceiptRow label="  Fees" value={`$${breakdown.fees.toFixed(2)}`} size="sm" />
              ) : null}
              {index < totals.length - 1 ? <ReceiptDivider /> : null}
            </View>
          );
        })}

        <ReceiptDivider />
        <ReceiptText bold size="sm">
          RECEIPT TOTAL
        </ReceiptText>
        <ReceiptRow label="Expected" value={`$${activeValidation.receiptTotal.toFixed(2)}`} />
        <ReceiptRow
          label="Computed"
          value={`$${activeValidation.computedTotal.toFixed(2)}`}
          bold
        />
      </ReceiptPaper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  warningBlock: {
    gap: Spacing.one,
  },
  personBlock: {
    gap: Spacing.one,
  },
});
