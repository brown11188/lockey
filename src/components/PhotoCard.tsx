import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Entry } from '../database/db';
import { COLORS, SPACING } from '../constants/theme';
import { formatCurrency, Currency } from '../utils/formatCurrency';
import { formatTime, formatDisplayDate } from '../utils/dateHelpers';
import CategoryBadge from './CategoryBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const H_PAD = SPACING.md;   // 16 — horizontal screen padding
const GAP   = SPACING.sm;   // 8  — gap between cards

export const GRID2_WIDTH   = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
export const GRID3_WIDTH   = (SCREEN_WIDTH - H_PAD * 2 - GAP * 2) / 3;
export const STRIP_FULL_W  = SCREEN_WIDTH - H_PAD * 2;
export const STRIP_HALF_W  = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;

export type CardVariant = 'grid2' | 'grid3' | 'fullStrip' | 'halfStrip';

// ─── Seeded deterministic manga style per entry ──────────────────────────────

function seededRNG(seed: number) {
  // LCG — cheap & deterministic
  let s = ((seed ^ 0xdeadbeef) * 2654435761) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export interface MangaStyle {
  rotation: number;      // degrees — image rotated inside the panel
  borderColor: string;
  borderWidth: number;
}

// Fixed aspect ratio per variant — all cards of the same variant are the same size
const VARIANT_ASPECT: Record<CardVariant, number> = {
  grid2:     1.0,   // square
  grid3:     1.0,   // square
  halfStrip: 1.0,   // square
  fullStrip: 0.65,  // wide landscape for the hero panel
};

const ROTATE_POOL = [-3.5, -2.5, -1.5, -1, 0, 1, 1.5, 2.5, 3.5];
const BORDER_POOL = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#F59E0B', '#FFFFFF'];

export function getMangaStyle(id: number): MangaStyle {
  const r = seededRNG(id);
  return {
    rotation:    ROTATE_POOL[Math.floor(r() * ROTATE_POOL.length)],
    borderColor: BORDER_POOL[Math.floor(r() * BORDER_POOL.length)],
    borderWidth: r() > 0.45 ? 3 : 2,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  entry: Entry;
  currency: Currency;
  onPress: () => void;
  onLongPress: () => void;
  variant?: CardVariant;
}

export default function PhotoCard({
  entry,
  currency,
  onPress,
  onLongPress,
  variant = 'grid2',
}: Props) {
  const ms = useMemo(() => getMangaStyle(entry.id), [entry.id]);

  const cardWidth   = cardWidthFor(variant);
  const aspectRatio = VARIANT_ASPECT[variant];
  const imageHeight = cardWidth / aspectRatio;
  // Scale up so rotation doesn't expose the card background behind the tilted image
  const scaleUp = Math.abs(ms.rotation) > 2 ? 1.18 : Math.abs(ms.rotation) > 0.5 ? 1.1 : 1.05;

  const isFullStrip = variant === 'fullStrip';
  const isGrid3     = variant === 'grid3';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          borderColor: ms.borderColor,
          borderWidth: ms.borderWidth,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.88}
    >
      {/* Photo panel — image slightly rotated inside */}
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image
          source={{ uri: entry.photo_uri }}
          style={[
            styles.image,
            {
              transform: [{ rotate: `${ms.rotation}deg` }, { scale: scaleUp }],
            },
          ]}
        />

        {/* Grid3: tiny amount chip over the photo */}
        {isGrid3 && (
          <View style={styles.grid3Chip}>
            <Text style={styles.grid3Amount} numberOfLines={1}>
              {formatCurrency(entry.amount, currency)}
            </Text>
          </View>
        )}
      </View>

      {/* Info footer — hidden for grid3 (too small) */}
      {!isGrid3 && (
        <View style={[styles.footer, isFullStrip && styles.footerStrip]}>
          <View style={styles.footerTop}>
            <Text style={styles.amount} numberOfLines={1}>
              {formatCurrency(entry.amount, currency)}
            </Text>
            <CategoryBadge category={entry.category} size="sm" />
          </View>

          {/* Full strip shows extra info */}
          {isFullStrip && (
            <>
              {entry.note ? (
                <Text style={styles.note} numberOfLines={1}>
                  {entry.note}
                </Text>
              ) : null}
              <Text style={styles.dateTime}>
                {formatDisplayDate(entry.created_at)} · {formatTime(entry.created_at)}
              </Text>
            </>
          )}

          {!isFullStrip && (
            <Text style={styles.time}>{formatTime(entry.created_at)}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function cardWidthFor(variant: CardVariant): number {
  switch (variant) {
    case 'grid2':     return GRID2_WIDTH;
    case 'grid3':     return GRID3_WIDTH;
    case 'fullStrip': return STRIP_FULL_W;
    case 'halfStrip': return STRIP_HALF_W;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: GAP,
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  footer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    gap: 3,
    backgroundColor: COLORS.card,
  },
  footerStrip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 5,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    flex: 1,
  },
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  dateTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // grid3 — amount chip overlaid on the photo
  grid3Chip: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 2,
  },
  grid3Amount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'center',
  },
});
