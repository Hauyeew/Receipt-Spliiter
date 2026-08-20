import { StyleSheet, View } from 'react-native';

import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptRow,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { Spacing } from '@/constants/theme';
import type { PersonBreakdown, SplitValidation } from '@/lib/split-calculator';
import type { SplitSession } from '@/models/SplitSession';

type SplitCheckReceiptProps = {
  session: SplitSession;
  totals: PersonBreakdown[];
  validation: SplitValidation;
};

export function SplitCheckReceipt({ session, totals, validation }: SplitCheckReceiptProps) {
  return (
    <ReceiptPaper>
      <ReceiptText center bold size="lg">
        {(session.receipt.merchantName || 'RECEIPT SPLITTER').toUpperCase()}
      </ReceiptText>
      <ReceiptText center muted size="sm">
        SPLIT CHECK
      </ReceiptText>
      <ReceiptDivider />

      {!validation.isValid ? (
        <View style={styles.warningBlock}>
          {validation.unclaimedItems.length > 0 ? (
            <ReceiptText muted size="sm">
              {validation.unclaimedItems.length} item(s) unclaimed ($
              {validation.unclaimedTotal.toFixed(2)})
            </ReceiptText>
          ) : null}
          {Math.abs(validation.difference) > 0.01 ? (
            <ReceiptText muted size="sm">
              Totals off by ${Math.abs(validation.difference).toFixed(2)}
            </ReceiptText>
          ) : null}
          <ReceiptDivider />
        </View>
      ) : null}

      {totals.map((breakdown, index) => {
        const participant = session.participants.find((person) => person.id === breakdown.personId);
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
      <ReceiptRow label="Expected" value={`$${validation.receiptTotal.toFixed(2)}`} />
      <ReceiptRow label="Computed" value={`$${validation.computedTotal.toFixed(2)}`} bold />
    </ReceiptPaper>
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
