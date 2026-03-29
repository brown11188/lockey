import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useEntries, FilterPeriod } from '../hooks/useEntries';
import { Entry } from '../database/db';
import PhotoCard, {
  GRID2_WIDTH,
  GRID3_WIDTH,
  STRIP_FULL_W,
  STRIP_HALF_W,
} from '../components/PhotoCard';
import {
  groupEntriesByDay,
  groupEntriesByWeek,
  formatDateHeader,
  formatWeekRangeHeader,
} from '../utils/dateHelpers';
import { formatCurrency, Currency } from '../utils/formatCurrency';
import { EntryDetailParams } from './EntryDetailScreen';

const { width } = Dimensions.get('window');
const GAP = SPACING.sm;

const FILTERS: { label: string; value: FilterPeriod; subtitle: string }[] = [
  { label: 'Week',  value: 'week',  subtitle: 'Daily Strip' },
  { label: 'Month', value: 'month', subtitle: 'Monthly Arc' },
  { label: 'All',   value: 'all',   subtitle: 'Archive'     },
];

interface Props {
  currency: Currency;
}

type NavProp = StackNavigationProp<EntryDetailParams>;

export default function GalleryScreen({ currency }: Props) {
  const navigation = useNavigation<NavProp>();
  const { entries, loading, loadEntries, removeEntry } = useEntries();
  const [filter, setFilter] = useState<FilterPeriod>('week');

  useFocusEffect(
    useCallback(() => {
      loadEntries(filter);
    }, [filter, loadEntries])
  );

  function handleDelete(entry: Entry) {
    Alert.alert('Delete Entry', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeEntry(entry.id, entry.photo_uri),
      },
    ]);
  }

  function navToDetail(entry: Entry) {
    navigation.navigate('EntryDetail', { entry, currency, onDelete: removeEntry });
  }

  const isEmpty = entries.length === 0 && !loading;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
              <Text style={[styles.filterSub, active && styles.filterSubActive]}>
                {f.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isEmpty ? (
        <EmptyState />
      ) : filter === 'week' ? (
        <WeekView
          entries={entries}
          currency={currency}
          loading={loading}
          onRefresh={() => loadEntries(filter)}
          onPress={navToDetail}
          onLongPress={handleDelete}
        />
      ) : filter === 'month' ? (
        <MonthView
          entries={entries}
          currency={currency}
          loading={loading}
          onRefresh={() => loadEntries(filter)}
          onPress={navToDetail}
          onLongPress={handleDelete}
        />
      ) : (
        <AllView
          entries={entries}
          currency={currency}
          loading={loading}
          onRefresh={() => loadEntries(filter)}
          onPress={navToDetail}
          onLongPress={handleDelete}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK VIEW — "Daily Strip"
// Alternating full-width / side-by-side manga panels, grouped by day
// ─────────────────────────────────────────────────────────────────────────────

type WeekItem =
  | { type: 'dayHeader'; dateKey: string; total: number }
  | { type: 'fullPanel'; entry: Entry }
  | { type: 'panelPair'; left: Entry; right: Entry | null };

function buildWeekItems(entries: Entry[]): WeekItem[] {
  const items: WeekItem[] = [];
  const grouped = groupEntriesByDay(entries);

  for (const [dateKey, dayEntries] of grouped.entries()) {
    const total = dayEntries.reduce((s, e) => s + e.amount, 0);
    items.push({ type: 'dayHeader', dateKey, total });

    let i = 0;
    let fullTurn = true; // start with a full-width panel
    while (i < dayEntries.length) {
      if (fullTurn) {
        items.push({ type: 'fullPanel', entry: dayEntries[i] });
        i += 1;
      } else {
        items.push({
          type: 'panelPair',
          left: dayEntries[i],
          right: dayEntries[i + 1] ?? null,
        });
        i += 2;
      }
      fullTurn = !fullTurn;
    }
  }
  return items;
}

interface ViewProps {
  entries: Entry[];
  currency: Currency;
  loading: boolean;
  onRefresh: () => void;
  onPress: (e: Entry) => void;
  onLongPress: (e: Entry) => void;
}

function WeekView({ entries, currency, loading, onRefresh, onPress, onLongPress }: ViewProps) {
  const items = buildWeekItems(entries);

  return (
    <FlatList<WeekItem>
      data={items}
      keyExtractor={(item, i) =>
        item.type === 'dayHeader' ? `wh-${item.dateKey}` : `wi-${i}`
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
      renderItem={({ item }) => {
        if (item.type === 'dayHeader') {
          return (
            <View style={styles.chapterHeader}>
              <View style={styles.chapterLine} />
              <View style={styles.chapterLabel}>
                <Text style={styles.chapterText}>
                  {formatDateHeader(item.dateKey + 'T00:00:00')}
                </Text>
                <Text style={styles.chapterTotal}>
                  {formatCurrency(item.total, currency)}
                </Text>
              </View>
              <View style={styles.chapterLine} />
            </View>
          );
        }
        if (item.type === 'fullPanel') {
          return (
            <PhotoCard
              entry={item.entry}
              currency={currency}
              variant="fullStrip"
              onPress={() => onPress(item.entry)}
              onLongPress={() => onLongPress(item.entry)}
            />
          );
        }
        // panelPair
        return (
          <View style={styles.pairRow}>
            <PhotoCard
              entry={item.left}
              currency={currency}
              variant="halfStrip"
              onPress={() => onPress(item.left)}
              onLongPress={() => onLongPress(item.left)}
            />
            {item.right ? (
              <PhotoCard
                entry={item.right}
                currency={currency}
                variant="halfStrip"
                onPress={() => onPress(item.right!)}
                onLongPress={() => onLongPress(item.right!)}
              />
            ) : (
              <View style={{ width: STRIP_HALF_W }} />
            )}
          </View>
        );
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTH VIEW — "Monthly Arc"
// Dense 3-column grid grouped by week sections
// ─────────────────────────────────────────────────────────────────────────────

type MonthItem =
  | { type: 'weekHeader'; weekKey: string; total: number; weekNum: number }
  | { type: 'trio'; e1: Entry; e2: Entry | null; e3: Entry | null };

function buildMonthItems(entries: Entry[]): MonthItem[] {
  const items: MonthItem[] = [];
  const grouped = groupEntriesByWeek(entries);
  let weekNum = 1;

  for (const [weekKey, weekEntries] of grouped.entries()) {
    const total = weekEntries.reduce((s, e) => s + e.amount, 0);
    items.push({ type: 'weekHeader', weekKey, total, weekNum: weekNum++ });

    for (let i = 0; i < weekEntries.length; i += 3) {
      items.push({
        type: 'trio',
        e1: weekEntries[i],
        e2: weekEntries[i + 1] ?? null,
        e3: weekEntries[i + 2] ?? null,
      });
    }
  }
  return items;
}

function MonthView({ entries, currency, loading, onRefresh, onPress, onLongPress }: ViewProps) {
  const items = buildMonthItems(entries);

  return (
    <FlatList<MonthItem>
      data={items}
      keyExtractor={(item, i) =>
        item.type === 'weekHeader' ? `mh-${item.weekKey}` : `mt-${i}`
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
      renderItem={({ item }) => {
        if (item.type === 'weekHeader') {
          return (
            <View style={styles.weekHeader}>
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>W{item.weekNum}</Text>
              </View>
              <View style={styles.weekHeaderInfo}>
                <Text style={styles.weekHeaderRange}>
                  {formatWeekRangeHeader(item.weekKey)}
                </Text>
                <Text style={styles.weekHeaderTotal}>
                  {formatCurrency(item.total, currency)}
                </Text>
              </View>
              <View style={styles.weekHeaderDivider} />
            </View>
          );
        }
        // trio row
        const placeholderStyle = { width: GRID3_WIDTH, marginBottom: GAP };
        return (
          <View style={styles.trioRow}>
            <PhotoCard
              entry={item.e1}
              currency={currency}
              variant="grid3"
              onPress={() => onPress(item.e1)}
              onLongPress={() => onLongPress(item.e1)}
            />
            {item.e2 ? (
              <PhotoCard
                entry={item.e2}
                currency={currency}
                variant="grid3"
                onPress={() => onPress(item.e2!)}
                onLongPress={() => onLongPress(item.e2!)}
              />
            ) : (
              <View style={placeholderStyle} />
            )}
            {item.e3 ? (
              <PhotoCard
                entry={item.e3}
                currency={currency}
                variant="grid3"
                onPress={() => onPress(item.e3!)}
                onLongPress={() => onLongPress(item.e3!)}
              />
            ) : (
              <View style={placeholderStyle} />
            )}
          </View>
        );
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL VIEW — "Archive"
// 2-column grid grouped by day with day totals
// ─────────────────────────────────────────────────────────────────────────────

type AllItem =
  | { type: 'dayHeader'; dateKey: string; total: number }
  | { type: 'pair'; left: Entry; right: Entry | null };

function buildAllItems(entries: Entry[]): AllItem[] {
  const items: AllItem[] = [];
  const grouped = groupEntriesByDay(entries);

  for (const [dateKey, dayEntries] of grouped.entries()) {
    const total = dayEntries.reduce((s, e) => s + e.amount, 0);
    items.push({ type: 'dayHeader', dateKey, total });

    for (let i = 0; i < dayEntries.length; i += 2) {
      items.push({
        type: 'pair',
        left: dayEntries[i],
        right: dayEntries[i + 1] ?? null,
      });
    }
  }
  return items;
}

function AllView({ entries, currency, loading, onRefresh, onPress, onLongPress }: ViewProps) {
  const items = buildAllItems(entries);

  return (
    <FlatList<AllItem>
      data={items}
      keyExtractor={(item, i) =>
        item.type === 'dayHeader' ? `ah-${item.dateKey}` : `ap-${i}`
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
      renderItem={({ item }) => {
        if (item.type === 'dayHeader') {
          return (
            <View style={styles.archiveHeader}>
              <Text style={styles.archiveDate}>
                {formatDateHeader(item.dateKey + 'T00:00:00')}
              </Text>
              <Text style={styles.archiveTotal}>
                {formatCurrency(item.total, currency)}
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.pairRow}>
            <PhotoCard
              entry={item.left}
              currency={currency}
              variant="grid2"
              onPress={() => onPress(item.left)}
              onLongPress={() => onLongPress(item.left)}
            />
            {item.right ? (
              <PhotoCard
                entry={item.right}
                currency={currency}
                variant="grid2"
                onPress={() => onPress(item.right!)}
                onLongPress={() => onLongPress(item.right!)}
              />
            ) : (
              <View style={{ width: GRID2_WIDTH }} />
            )}
          </View>
        );
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📷</Text>
      <Text style={styles.emptyTitle}>No photos yet</Text>
      <Text style={styles.emptySubtitle}>
        Capture your first spending moment from the camera tab.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Filter bar ──────────────────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    gap: 2,
  },
  filterBtnActive: {
    backgroundColor: COLORS.accent,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterLabelActive: { color: '#000' },
  filterSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterSubActive: { color: '#00000088' },

  // ── Shared list ─────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  pairRow: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'flex-start', // panels can have different heights
  },
  trioRow: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'flex-start',
  },

  // ── Week view — "Daily Strip" ────────────────────────────────────────────────
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  chapterLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  chapterLabel: {
    alignItems: 'center',
    gap: 2,
  },
  chapterText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chapterTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },

  // ── Month view — "Monthly Arc" ───────────────────────────────────────────────
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  weekBadge: {
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  weekHeaderInfo: {
    flex: 1,
  },
  weekHeaderRange: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekHeaderTotal: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  weekHeaderDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  // ── All view — "Archive" ─────────────────────────────────────────────────────
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 6,
  },
  archiveDate: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  archiveTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },

  // ── Empty ───────────────────────────────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
