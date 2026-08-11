import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ReceiptPalette } from '@/components/ui/receipt-paper';
import { Fonts, Spacing } from '@/constants/theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ label, variant = 'primary', style, disabled, ...props }: PrimaryButtonProps) {
  const backgroundColor =
    variant === 'primary'
      ? ReceiptPalette.ink
      : variant === 'danger'
        ? '#e5484d'
        : ReceiptPalette.paper;

  const textColor =
    variant === 'secondary' ? ReceiptPalette.ink : variant === 'primary' ? ReceiptPalette.paper : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => {
        const flattenedStyle = typeof style === 'function' ? style(state) : style;
        return [
          styles.button,
          {
            backgroundColor,
            borderColor: ReceiptPalette.ink,
            borderWidth: variant === 'secondary' ? 1.5 : 0,
            opacity: disabled ? 0.5 : state.pressed ? 0.85 : 1,
          },
          flattenedStyle,
        ];
      }}
      {...props}>
      <ThemedText type="smallBold" style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    fontFamily: Fonts.mono,
  },
});
