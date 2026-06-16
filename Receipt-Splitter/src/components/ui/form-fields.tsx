import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
};

export function LabeledInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: LabeledInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedView type="backgroundElement" style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </ThemedView>
    </View>
  );
}

type MoneyRowProps = {
  label: string;
  amount: number;
  emphasized?: boolean;
};

export function MoneyRow({ label, amount, emphasized }: MoneyRowProps) {
  return (
    <View style={styles.moneyRow}>
      <ThemedText type={emphasized ? 'smallBold' : 'small'}>{label}</ThemedText>
      <ThemedText type={emphasized ? 'smallBold' : 'small'}>${amount.toFixed(2)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputWrapper: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
