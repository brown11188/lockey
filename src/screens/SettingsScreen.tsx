import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { clearAllEntries } from '../database/db';
import { Currency } from '../utils/formatCurrency';

interface Props {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onDataCleared: () => void;
}

export default function SettingsScreen({
  currency,
  onCurrencyChange,
  onDataCleared,
}: Props) {
  function handleCurrencyToggle(value: boolean) {
    onCurrencyChange(value ? 'VND' : 'USD');
  }

  function confirmClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your entries and photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllEntries();
            onDataCleared();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionHeader}>Preferences</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Currency</Text>
              <Text style={styles.rowSubtitle}>
                Currently: {currency === 'VND' ? '₫ Vietnamese Dong' : '$ US Dollar'}
              </Text>
            </View>
            <View style={styles.currencyToggle}>
              <Text style={[styles.currencyLabel, currency === 'USD' && styles.activeCurrency]}>
                $
              </Text>
              <Switch
                value={currency === 'VND'}
                onValueChange={handleCurrencyToggle}
                trackColor={{ false: COLORS.border, true: COLORS.accent + '60' }}
                thumbColor={currency === 'VND' ? COLORS.accent : COLORS.textSecondary}
              />
              <Text style={[styles.currencyLabel, currency === 'VND' && styles.activeCurrency]}>
                ₫
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Data</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={confirmClearData}>
            <View>
              <Text style={styles.dangerTitle}>Clear All Data</Text>
              <Text style={styles.dangerSubtitle}>
                Delete all entries and photos permanently
              </Text>
            </View>
            <Text style={styles.dangerIcon}>🗑</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>About</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Lockey</Text>
            <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Storage</Text>
            <Text style={styles.rowSubtitleRight}>Local only · No cloud sync</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.sm },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  rowTitle: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowSubtitleRight: { fontSize: 12, color: COLORS.textMuted },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
    width: 16,
    textAlign: 'center',
  },
  activeCurrency: { color: COLORS.accent },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  dangerTitle: { fontSize: 15, color: COLORS.error, fontWeight: '500' },
  dangerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dangerIcon: { fontSize: 20 },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
});
