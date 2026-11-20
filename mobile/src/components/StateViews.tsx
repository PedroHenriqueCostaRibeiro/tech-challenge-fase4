import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button, type IconName } from './Button';

export function LoadingView({ message = 'Carregando...' }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={typography.caption}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
      <Text style={[typography.body, styles.text]} accessibilityLiveRegion="polite">
        {message}
      </Text>
      {onRetry && <Button title="Tentar novamente" icon="refresh" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function EmptyView({
  title,
  message,
  icon = 'document-text-outline',
}: {
  title: string;
  message?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={typography.subtitle}>{title}</Text>
      {message && <Text style={[typography.caption, styles.text]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    minHeight: 240,
  },
  text: { textAlign: 'center' },
});
