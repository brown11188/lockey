import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useEntries } from '../hooks/useEntries';
import { useStats } from '../hooks/useStats';
import SummaryCard from '../components/SummaryCard';
import CategoryBadge from '../components/CategoryBadge';
import { WeeklyBarChart, CategoryPieChart } from '../components/SpendingChart';
import { formatCurrency, Currency } from '../utils/formatCurrency';
import { formatDisplayDate, formatTime } from '../utils/dateHelpers';
import { EntryDetailParams } from './EntryDetailScreen';

const { width } = Dimensions.get('window');

interface Props {
  currency: Currency;
}

type NavProp = StackNavigationProp<EntryDetailParams>;

export default function StatsScreen({ currency }: Props) {
  const navigation = useNavigation<NavProp>();
  const { entries, loading, loadEntries, removeEntry } = useEntries();
  const stats = useStats(entries);
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  useFocusEffect(
    useCallback(() => {
      loadEntries('all');
    }, [loadEntries])
  );

  const recent = entries.slice(0, 10);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadEntries('all')}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <SummaryCard
            title="This Week"
            value={formatCurrency(stats.totalWeek, currency)}
            accent
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(stats.totalMonth, currency)}
          />
        </View>
        <SummaryCard
          title="Top Category"
          value={stats.topCategory}
          subtitle="highest spending this month"
        />

        {/* View Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'weekly' && styles.toggleBtnActive]}
            onPress={() => setView('weekly')}
          >
            <Text
              style={[
                styles.toggleText,
                view === 'weekly' && styles.toggleTextActive,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setView('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                view === 'monthly' && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Charts */}
        {view === 'weekly' ? (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Spending · This Week</Text>
            <WeeklyBarChart data={stats.weeklyChart} currency={currency} />
          </View>
        ) : (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Category · This Month</Text>
            <CategoryPieChart data={stats.categoryChart} />
          </View>
        )}

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          recent.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.transactionRow}
              onPress={() =>
                navigation.navigate('EntryDetail', {
                  entry,
                  currency,
                  onDelete: removeEntry,
                })
              }
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: entry.photo_uri }}
                style={styles.transactionThumb}
              />
              <View style={styles.transactionInfo}>
                <View style={styles.transactionTop}>
                  <Text style={styles.transactionAmount} numberOfLines={1}>
                    {formatCurrency(entry.amount, currency)}
                  </Text>
                  <CategoryBadge category={entry.category} size="sm" />
                </View>
                <Text style={styles.transactionDate}>
                  {formatDisplayDate(entry.created_at)} · {formatTime(entry.created_at)}
                </Text>
                {entry.note ? (
                  <Text style={styles.transactionNote} numberOfLines={1}>
                    {entry.note}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: COLORS.accent },
  toggleText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#000' },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  transactionRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    gap: SPACING.md,
    alignItems: 'center',
  },
  transactionThumb: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.surface,
  },
  transactionInfo: {
    flex: 1,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 3,
  },
  transactionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    flex: 1,
  },
  transactionDate: { fontSize: 11, color: COLORS.textMuted },
  transactionNote: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
});
