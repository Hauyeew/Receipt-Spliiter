import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LabeledInput, MoneyRow } from '@/components/ui/form-fields';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';
import { computeTipTotal } from '@/lib/split-calculator';
import { parseMoneyInput } from '@/lib/format-money';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const {
    updateLineItem,
    addLineItem,
    removeLineItem,
    updateReceiptField,
    updateTipSettings,
  } = useSplitContext();

  const tipTotal = computeTipTotal(session);

  return (
    <ScreenContainer
      title="Review receipt"
      subtitle={session.receipt.merchantName ?? 'Edit items and charges before splitting.'}
      footer={
        <PrimaryButton
          label="Continue to participants"
          onPress={() => router.push(`/split/${id}/people`)}
        />
      }>
      <LabeledInput
        label="Restaurant"
        value={session.receipt.merchantName ?? ''}
        onChangeText={(value) => updateReceiptField('merchantName', value)}
        placeholder="Restaurant name"
      />

      <ThemedText type="smallBold">Line items</ThemedText>
      {session.receipt.lineItems.map((item, index) => (
        <ThemedView key={item.id} type="backgroundElement" style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <ThemedText type="smallBold">Item {index + 1}</ThemedText>
            {session.receipt.lineItems.length > 1 ? (
              <Pressable onPress={() => removeLineItem(item.id)}>
                <ThemedText type="linkPrimary">Remove</ThemedText>
              </Pressable>
            ) : null}
          </View>

          <LabeledInput
            label="Name"
            value={item.name}
            onChangeText={(value) => updateLineItem(item.id, { name: value })}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <LabeledInput
                label="Qty"
                value={String(item.quantity)}
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  updateLineItem(item.id, { quantity: parseMoneyInput(value) || 1 })
                }
              />
            </View>
            <View style={styles.half}>
              <LabeledInput
                label="Price"
                value={item.unitPrice ? String(item.unitPrice) : ''}
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  updateLineItem(item.id, { unitPrice: parseMoneyInput(value) })
                }
              />
            </View>
          </View>

          <MoneyRow label="Line total" amount={item.lineTotal} />
        </ThemedView>
      ))}

      <PrimaryButton label="Add item" variant="secondary" onPress={addLineItem} />

      <ThemedView type="backgroundElement" style={styles.summaryCard}>
        <MoneyRow label="Subtotal" amount={session.receipt.subtotal} />
        <LabeledInput
          label="Tax"
          value={session.receipt.tax ? String(session.receipt.tax) : ''}
          keyboardType="decimal-pad"
          onChangeText={(value) => updateReceiptField('tax', parseMoneyInput(value))}
        />
        <LabeledInput
          label="Fees"
          value={session.receipt.fees ? String(session.receipt.fees) : ''}
          keyboardType="decimal-pad"
          onChangeText={(value) => updateReceiptField('fees', parseMoneyInput(value))}
        />
        <LabeledInput
          label="Tip %"
          value={String(session.tipValue)}
          keyboardType="decimal-pad"
          onChangeText={(value) => updateTipSettings('percent', parseMoneyInput(value))}
        />
        <MoneyRow label="Tip amount" amount={tipTotal} />
        <MoneyRow label="Total" amount={session.receipt.total} emphasized />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
  summaryCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
