import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Entry } from '../database/db';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { formatCurrency, Currency } from '../utils/formatCurrency';
import { formatDisplayDate, formatTime } from '../utils/dateHelpers';
import CategoryBadge from '../components/CategoryBadge';

const { width } = Dimensions.get('window');

export type EntryDetailParams = {
  EntryDetail: {
    entry: Entry;
    currency: Currency;
    onDelete: (id: number, photoUri: string) => void;
  };
};

export default function EntryDetailScreen() {
  const route = useRoute<RouteProp<EntryDetailParams, 'EntryDetail'>>();
  const navigation = useNavigation();
  const { entry, currency, onDelete } = route.params;

  function confirmDelete() {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(entry.id, entry.photo_uri);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: entry.photo_uri }} style={styles.photo} />

        <View style={styles.content}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {formatCurrency(entry.amount, currency)}
            </Text>
            <CategoryBadge category={entry.category} />
          </View>

          {entry.note ? (
            <Text style={styles.note}>{entry.note}</Text>
          ) : null}

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {formatDisplayDate(entry.created_at)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>
                {formatTime(entry.created_at)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{entry.category}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteButtonText}>🗑 Delete Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  photo: {
    width,
    height: width,
    resizeMode: 'cover',
    backgroundColor: COLORS.surface,
  },
  content: { padding: SPACING.md, gap: SPACING.md },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.accent,
  },
  note: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  metaCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  metaLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '18',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '44',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 15,
  },
});
