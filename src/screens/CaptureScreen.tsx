import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { CATEGORIES, Category } from '../constants/categories';
import CategoryBadge from '../components/CategoryBadge';
import { insertEntry } from '../database/db';
import { formatAmountInput, parseAmount, Currency } from '../utils/formatCurrency';
import { format, parse, isValid } from 'date-fns';

const { width } = Dimensions.get('window');

interface Props {
  currency: Currency;
}

export default function CaptureScreen({ currency }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState('');
  // The display string the user edits directly
  const [dateDisplay, setDateDisplay] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const openPreview = useCallback((uri: string) => {
    const now = new Date();
    setPreviewUri(uri);
    setDateStr(now.toISOString());
    setDateDisplay(format(now, 'MMM d, yyyy · h:mm a'));
    setAmount('');
    setNote('');
    setCategory('Food');
    setShowCategoryPicker(false);
  }, []);

  function handleDateDisplayChange(text: string) {
    setDateDisplay(text);
    // Try parsing common formats; fall back to keeping the previous ISO string
    const formats = ['MMM d, yyyy · h:mm a', 'MMM d, yyyy h:mm a', 'MM/dd/yyyy HH:mm', 'yyyy-MM-dd HH:mm'];
    for (const fmt of formats) {
      try {
        const parsed = parse(text, fmt, new Date());
        if (isValid(parsed)) {
          setDateStr(parsed.toISOString());
          return;
        }
      } catch {}
    }
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      const filename = `lockey_${Date.now()}.jpg`;
      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: photo.uri, to: dest });
      openPreview(dest);
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const filename = `lockey_${Date.now()}.jpg`;
      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
      openPreview(dest);
    }
  }

  async function saveEntry() {
    if (!previewUri) return;
    const parsedAmount = parseAmount(amount);
    if (parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await insertEntry({
        photo_uri: previewUri,
        amount: parsedAmount,
        category,
        note: note.trim(),
        created_at: dateStr || new Date().toISOString(),
      });
      setPreviewUri(null);
      Alert.alert('Saved!', 'Your spending has been recorded.');
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function dismissPreview() {
    Alert.alert('Discard?', 'Discard this photo without saving?', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          if (previewUri) {
            try { await FileSystem.deleteAsync(previewUri); } catch {}
          }
          setPreviewUri(null);
        },
      },
    ]);
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionView}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            Lockey needs camera access to capture your spending moments.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryFallback} onPress={pickFromGallery}>
            <Text style={styles.galleryFallbackText}>Or pick from gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <SafeAreaView style={styles.cameraUI} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <Text style={styles.logoText}>Lockey</Text>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            >
              <Text style={styles.flipIcon}>🔄</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
              <Text style={styles.galleryIcon}>🖼️</Text>
              <Text style={styles.galleryLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <View style={{ width: 64 }} />
          </View>
        </SafeAreaView>
      </CameraView>

      {/* Preview Modal — insets applied manually so header always clears the notch/island */}
      <Modal visible={!!previewUri} animationType="slide">
        <View style={[styles.modalRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalFlex}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={dismissPreview} hitSlop={12}>
                <Text style={styles.modalCancel}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Details</Text>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveEntry}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {previewUri && (
                <Image source={{ uri: previewUri }} style={styles.previewImage} />
              )}

              <View style={styles.formContainer}>
                {/* Amount */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={styles.amountRow}>
                    <Text style={styles.currencySymbol}>
                      {currency === 'VND' ? '₫' : '$'}
                    </Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={(t) => setAmount(formatAmountInput(t, currency))}
                    />
                  </View>
                </View>

                {/* Category — inline picker, no second Modal */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <TouchableOpacity
                    style={[
                      styles.categorySelector,
                      showCategoryPicker && styles.categorySelectorOpen,
                    ]}
                    onPress={() => setShowCategoryPicker((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <CategoryBadge category={category} />
                    <Text style={[styles.chevron, showCategoryPicker && styles.chevronUp]}>
                      ›
                    </Text>
                  </TouchableOpacity>

                  {showCategoryPicker && (
                    <View style={styles.categoryList}>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          style={({ pressed }) => [
                            styles.categoryOption,
                            cat === category && styles.categoryOptionActive,
                            pressed && styles.categoryOptionPressed,
                          ]}
                          onPress={() => {
                            setCategory(cat);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <CategoryBadge category={cat} />
                          {cat === category && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Note */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Note</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a caption..."
                    placeholderTextColor={COLORS.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={200}
                  />
                </View>

                {/* Date & Time — editable TextInput */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Date & Time</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={dateDisplay}
                    onChangeText={handleDateDisplayChange}
                    placeholder="MMM d, yyyy · h:mm a"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="done"
                  />
                  <Text style={styles.dateHint}>
                    e.g. {format(new Date(), 'MMM d, yyyy · h:mm a')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraUI: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -0.5,
  },
  flipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  flipIcon: { fontSize: 20 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  galleryButton: { alignItems: 'center', width: 64 },
  galleryIcon: { fontSize: 28 },
  galleryLabel: { fontSize: 11, color: '#fff', marginTop: 2 },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  permissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  permissionEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  permissionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: SPACING.md,
  },
  permissionButtonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  galleryFallback: { paddingVertical: 8 },
  galleryFallbackText: { color: COLORS.textSecondary, fontSize: 14 },

  // Modal layout — SafeAreaView as root ensures header clears the notch
  modalRoot: { flex: 1, backgroundColor: COLORS.background },
  modalFlex: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: { fontSize: 18, color: COLORS.textSecondary, padding: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  modalScroll: { flex: 1 },
  previewImage: {
    width,
    height: width,
    resizeMode: 'cover',
  },
  formContainer: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  formField: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: 22,
    color: COLORS.accent,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categorySelectorOpen: {
    borderColor: COLORS.accent,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textMuted,
    transform: [{ rotate: '90deg' }],
    lineHeight: 22,
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
    color: COLORS.accent,
  },
  categoryList: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.accent,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.accent + '14',
  },
  categoryOptionPressed: {
    backgroundColor: COLORS.border,
  },
  checkmark: { fontSize: 16, color: COLORS.accent, fontWeight: '700' },
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateInput: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    paddingLeft: 2,
  },
});
