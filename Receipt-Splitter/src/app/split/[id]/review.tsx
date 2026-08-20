import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptInput,
  ReceiptPaper,
  ReceiptPalette,
  ReceiptRow,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';
import { computeTipTotal, getReceiptSubtotal } from '@/lib/split-calculator';
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

  if (!session) {
    return <Redirect href="/" />;
  }

  const tipTotal = computeTipTotal(session);
  const subtotal = getReceiptSubtotal(session.receipt);
  const taxRatePercent = subtotal > 0 ? (session.receipt.tax / subtotal) * 100 : 0;

  return (
    <ScreenContainer
      variant="receipt"
      title="Review receipt"
      subtitle="Tap underlined fields to edit before splitting."
      footer={
        <PrimaryButton
          label="Continue to participants"
          onPress={() => router.push(`/split/${id}/people`)}
        />
      }>
      <ReceiptPaper>
        <ReceiptText center bold size="lg">
          {session.receipt.merchantName?.toUpperCase() || 'YOUR RECEIPT'}
        </ReceiptText>

        {session.receipt.imageUri ? (
          <>
            <ReceiptDivider />
            <Image
              source={{ uri: session.receipt.imageUri }}
              style={styles.receiptImage}
              contentFit="contain"
            />
          </>
        ) : null}

        <ReceiptDivider />
        <ReceiptText muted size="sm" center>
          --------------------------
        </ReceiptText>
        <ReceiptText bold size="sm">
          ITEMS
        </ReceiptText>

        {session.receipt.lineItems.map((item, index) => (
          <View key={item.id} style={styles.itemBlock}>
            <View style={styles.itemHeader}>
              <ReceiptText bold size="lg">
                #{index + 1}
              </ReceiptText>
              {session.receipt.lineItems.length > 1 ? (
                <Pressable onPress={() => removeLineItem(item.id)}>
                  <ReceiptText muted size="sm">
                    remove
                  </ReceiptText>
                </Pressable>
              ) : null}
            </View>

            <ReceiptInput
              value={item.name}
              onChangeText={(value) => updateLineItem(item.id, { name: value })}
              placeholder="Item name"
              size="lg"
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <ReceiptInput
                  label="Qty"
                  value={String(item.quantity)}
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    updateLineItem(item.id, { quantity: parseMoneyInput(value) || 1 })
                  }
                />
              </View>
              <View style={styles.half}>
                <ReceiptInput
                  label="Price"
                  value={item.unitPrice ? String(item.unitPrice) : ''}
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    updateLineItem(item.id, { unitPrice: parseMoneyInput(value) })
                  }
                />
              </View>
            </View>

            <ReceiptRow label="Line total" value={`$${item.lineTotal.toFixed(2)}`} />
            {index < session.receipt.lineItems.length - 1 ? <ReceiptDivider /> : null}
          </View>
        ))}

        <Pressable onPress={addLineItem} style={styles.addItem}>
          <ReceiptText center muted>
            + ADD ITEM
          </ReceiptText>
        </Pressable>

        <ReceiptDivider />
        <ReceiptRow label="SUBTOTAL" value={`$${session.receipt.subtotal.toFixed(2)}`} bold />

        <View style={styles.row}>
          <View style={styles.half}>
            <ReceiptInput
              label="Tax $"
              value={session.receipt.tax ? String(session.receipt.tax) : ''}
              keyboardType="decimal-pad"
              onChangeText={(value) => updateReceiptField('tax', parseMoneyInput(value))}
            />
          </View>
          <View style={styles.half}>
            <ReceiptInput
              label="Fees $"
              value={session.receipt.fees ? String(session.receipt.fees) : ''}
              keyboardType="decimal-pad"
              onChangeText={(value) => updateReceiptField('fees', parseMoneyInput(value))}
            />
          </View>
        </View>

        {session.receipt.tax > 0 && subtotal > 0 ? (
          <ReceiptText muted size="sm">
            Tax rate ~{taxRatePercent.toFixed(2)}% of food
          </ReceiptText>
        ) : null}

        {!session.tipValue ? (
          <View style={styles.tipNotice}>
            <ReceiptText bold size="md" style={styles.tipNoticeText}>
              Please enter the percentage tipped
            </ReceiptText>
          </View>
        ) : null}
        <ReceiptInput
          label="Tip %"
          value={session.tipValue ? String(session.tipValue) : ''}
          placeholder="e.g. 18"
          emphasis={!session.tipValue}
          keyboardType="decimal-pad"
          onChangeText={(value) => updateTipSettings('percent', parseMoneyInput(value))}
        />
        <ReceiptRow label="TIP" value={`$${tipTotal.toFixed(2)}`} />
        <ReceiptDivider />
        <ReceiptRow label="TOTAL" value={`$${session.receipt.total.toFixed(2)}`} bold size="lg" />
      </ReceiptPaper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  receiptImage: {
    width: '100%',
    height: 180,
  },
  itemBlock: {
    gap: Spacing.two,
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
  addItem: {
    paddingVertical: Spacing.two,
  },
  tipNotice: {
    backgroundColor: ReceiptPalette.accentSoft,
    borderLeftWidth: 4,
    borderLeftColor: ReceiptPalette.accent,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tipNoticeText: {
    color: ReceiptPalette.accentInk,
  },
});
