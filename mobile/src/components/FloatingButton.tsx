import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { colors, shadow, spacing } from '@/theme';
import type { IconName } from './Button';

interface FloatingButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
}

/** Botão flutuante (FAB) no canto inferior direito, ex.: "Novo post". */
export function FloatingButton({ icon, accessibilityLabel, onPress }: FloatingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icon} size={28} color={colors.textOnPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowOpacity: 0.25,
    elevation: 6,
  },
});
