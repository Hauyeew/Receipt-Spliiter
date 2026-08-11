import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptPalette,
  ReceiptRow,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';
import { usePersonTotal } from '@/hooks/use-split-totals';
import {
  getClaimedQuantity,
  getClaimerIds,
  getMaxClaimQuantity,
  getTotalClaimedQuantity,
  itemShareForPerson,
} from '@/models/LineItem';

export default function SelectItemsScreen() {
  const { id, personId } = useLocalSearchParams<{ id: string; personId: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const { adjustItemClaimQuantity } = useSplitContext();
  const breakdown = usePersonTotal(session, personId);

  if (!session) {
    return <Redirect href="/" />;
  }

  const participant = session.participants.find((person) => person.id === personId);
  const currentIndex = session.participants.findIndex((person) => person.id === personId);
  const nextParticipant = session.participants[currentIndex + 1];

  if (!participant) {
    return (
      <ScreenContainer variant="receipt" title="Participant not found">
        <PrimaryButton
          label="Back to participants"
          onPress={() => router.push(`/split/${id}/people`)}
        />
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
      variant="receipt"
      title={`What did ${participant.name} order?`}
      subtitle="Use + / − to claim how many of each item you ordered."
      footer={
        <>
          <View style={styles.footerTotals}>
            <ReceiptRow label="Food" value={`$${breakdown.food.toFixed(2)}`} />
            <ReceiptRow label="Tax" value={`$${breakdown.tax.toFixed(2)}`} />
            <ReceiptRow label="Tip" value={`$${breakdown.tip.toFixed(2)}`} />
            {breakdown.fees > 0 ? (
              <ReceiptRow label="Fees" value={`$${breakdown.fees.toFixed(2)}`} />
            ) : null}
            <ReceiptRow label="TOTAL" value={`$${breakdown.total.toFixed(2)}`} bold size="lg" />
          </View>
          <PrimaryButton
            label={nextParticipant ? `Continue to ${nextParticipant.name}` : 'View summary'}
            onPress={handleContinue}
          />
        </>
      }>
      <ReceiptPaper>
        <ReceiptText center bold size="lg">
          {participant.name.toUpperCase()}&apos;S ORDER
        </ReceiptText>
        <ReceiptText center muted size="sm">
          CLAIM YOUR ITEMS
        </ReceiptText>
        <ReceiptDivider />

        {session.receipt.lineItems.map((item, index) => {
          const claimedQuantity = getClaimedQuantity(item, personId);
          const share = itemShareForPerson(item, personId);
          const maxQuantity = getMaxClaimQuantity(item, personId);
          const remainingTotal = Math.max(0, item.quantity - getTotalClaimedQuantity(item));
          const claimers = getClaimerIds(item).length;
          const isSelected = claimedQuantity > 0;
          const isMultiQuantity = item.quantity > 1;

          return (
            <View key={item.id} style={styles.itemBlock}>
              <View style={styles.itemRow}>
                <View style={styles.itemContent}>
                  <ReceiptText bold={isSelected}>{item.name}</ReceiptText>
                  <ReceiptText muted size="sm">
                    {isMultiQuantity
                      ? `${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.lineTotal.toFixed(2)}`
                      : `$${item.lineTotal.toFixed(2)}`}
                    {isMultiQuantity
                      ? remainingTotal > 0
                        ? ` · ${remainingTotal} left`
                        : ' · fully claimed'
                      : claimers > 1
                        ? ` · split ${claimers} ways`
                        : ''}
                  </ReceiptText>
                  {isSelected ? (
                    <ReceiptText muted size="sm">
                      Your share: ${share.toFixed(2)}
                    </ReceiptText>
                  ) : null}
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${item.name}`}
                    disabled={claimedQuantity <= 0}
                    onPress={() => adjustItemClaimQuantity(item.id, personId, -1)}
                    style={[styles.stepperButton, claimedQuantity <= 0 && styles.stepperDisabled]}>
                    <ReceiptText bold>−</ReceiptText>
                  </Pressable>
                  <ReceiptText bold style={styles.stepperValue}>
                    {claimedQuantity}
                  </ReceiptText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${item.name}`}
                    disabled={claimedQuantity >= maxQuantity}
                    onPress={() => adjustItemClaimQuantity(item.id, personId, 1)}
                    style={[
                      styles.stepperButton,
                      claimedQuantity >= maxQuantity && styles.stepperDisabled,
                    ]}>
                    <ReceiptText bold>+</ReceiptText>
                  </Pressable>
                </View>
              </View>
              {index < session.receipt.lineItems.length - 1 ? <ReceiptDivider /> : null}
            </View>
          );
        })}
      </ReceiptPaper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  itemBlock: {
    gap: Spacing.two,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  itemContent: {
    flex: 1,
    gap: Spacing.half,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ReceiptPalette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ReceiptPalette.paper,
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  stepperValue: {
    minWidth: 18,
    textAlign: 'center',
  },
  footerTotals: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: ReceiptPalette.paper,
  },
});
