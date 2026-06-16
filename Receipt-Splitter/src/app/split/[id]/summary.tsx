import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { MoneyRow } from '@/components/ui/form-fields';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';
import { useSplitTotals } from '@/hooks/use-split-totals';
import { validateSplit } from '@/lib/split-calculator';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const { clearSession } = useSplitContext();
  const totals = useSplitTotals(session);
  const validation = validateSplit(session);

  function handleDone() {
    clearSession();
    router.replace('/');
  }

  function handleEditSelections() {
    const firstParticipant = session.participants[0];
    router.push(`/split/${id}/select/${firstParticipant.id}`);
  }

  return (
    <ScreenContainer
      title="Split summary"
      subtitle={session.receipt.merchantName ?? 'Here is what everyone owes.'}
      footer={
        <>
          <PrimaryButton label="Edit selections" variant="secondary" onPress={handleEditSelections} />
          <PrimaryButton label="Done" onPress={handleDone} />
        </>
      }>
      {!validation.isValid ? (
        <ThemedView type="backgroundElement" style={styles.warningCard}>
          {validation.unclaimedItems.length > 0 ? (
            <ThemedText type="small">
              {validation.unclaimedItems.length} item(s) still unclaimed (${validation.unclaimedTotal.toFixed(2)}).
            </ThemedText>
          ) : null}
          {Math.abs(validation.difference) > 0.01 ? (
            <ThemedText type="small">
              Totals are off by ${Math.abs(validation.difference).toFixed(2)} vs receipt.
            </ThemedText>
          ) : null}
        </ThemedView>
      ) : null}

      {totals.map((breakdown) => {
        const participant = session.participants.find((person) => person.id === breakdown.personId);
        if (!participant) {
          return null;
        }

        return (
          <ThemedView key={breakdown.personId} type="backgroundElement" style={styles.personCard}>
            <ThemedText type="smallBold">{participant.name}</ThemedText>
            <MoneyRow label="Food" amount={breakdown.food} />
            <MoneyRow label="Tax" amount={breakdown.tax} />
            <MoneyRow label="Tip" amount={breakdown.tip} />
            {breakdown.fees > 0 ? <MoneyRow label="Fees" amount={breakdown.fees} /> : null}
            <MoneyRow label="Total" amount={breakdown.total} emphasized />
          </ThemedView>
        );
      })}

      <ThemedView type="backgroundElement" style={styles.receiptCard}>
        <ThemedText type="smallBold">Receipt total</ThemedText>
        <MoneyRow label="Expected" amount={validation.receiptTotal} />
        <MoneyRow label="Computed" amount={validation.computedTotal} emphasized />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  personCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  receiptCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
