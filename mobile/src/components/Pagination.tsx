import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/theme';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, total, onChange, disabled = false }: PaginationProps) {
  return (
    <View style={styles.container}>
      <Button
        title="Anterior"
        icon="chevron-back"
        size="sm"
        variant="secondary"
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
        accessibilityLabel="Página anterior"
      />
      <View style={styles.info} accessibilityLiveRegion="polite">
        <Text style={typography.label}>
          Página {page} de {totalPages}
        </Text>
        <Text style={typography.caption}>{total} no total</Text>
      </View>
      <Button
        title="Próxima"
        icon="chevron-forward"
        size="sm"
        variant="secondary"
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
        accessibilityLabel="Próxima página"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  info: { alignItems: 'center' },
});
