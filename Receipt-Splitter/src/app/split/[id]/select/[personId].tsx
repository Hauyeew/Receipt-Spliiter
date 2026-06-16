import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MoneyRow } from '@/components/ui/form-fields';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';
import { usePersonTotal } from '@/hooks/use-split-totals';

export default function SelectItemsScreen() {
  const { id, personId } = useLocalSearchParams<{ id: string; personId: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const { toggleItemClaim } = useSplitContext();

  const participant = session.participants.find((person) => person.id === personId);
  const breakdown = usePersonTotal(session, personId);
  const currentIndex = session.participants.findIndex((person) => person.id === personId);
  const nextParticipant = session.participants[currentIndex + 1];

  if (!participant) {
    return (
      <ScreenContainer title="Participant not found">
        <PrimaryButton label="Back to participants" onPress={() => router.push(`/split/${id}/people`)} />
      </ScreenContainer>
    );
  }

  function handleContinue() {
    if (nextParticipant) {
      router.push(`/split/${id}/select/${nextParticipant.id}`);
      return;
    }
    router.push(`/split/${id}/summary`);
  }

  return (
    <ScreenContainer
      title={`What did ${participant.name} order?`}
      subtitle="Tap items to claim them. Shared items split evenly among everyone who selects them."
      footer={
        <>
          <ThemedView type="backgroundElement" style={styles.totalCard}>
            <MoneyRow label="Food" amount={breakdown.food} />
            <MoneyRow label="Tax" amount={breakdown.tax} />
            <MoneyRow label="Tip" amount={breakdown.tip} />
            {breakdown.fees > 0 ? <MoneyRow label="Fees" amount={breakdown.fees} /> : null}
            <MoneyRow label="Total so far" amount={breakdown.total} emphasized />
          </ThemedView>
          <PrimaryButton
            label={nextParticipant ? `Continue to ${nextParticipant.name}` : 'View summary'}
            onPress={handleContinue}
          />
        </>
      }>
      {session.receipt.lineItems.map((item) => {
        const isSelected = item.claimedBy.includes(personId);
        const sharedCount = item.claimedBy.length;

        return (
          <Pressable key={item.id} onPress={() => toggleItemClaim(item.id, personId)}>
            <ThemedView
              type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.itemRow}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
              </View>
              <View style={styles.itemContent}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ${item.lineTotal.toFixed(2)}
                  {sharedCount > 1 ? ` · split ${sharedCount} ways` : ''}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3c87f7',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    gap: Spacing.half,
  },
  totalCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
