import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowCard } from '../../src/components/GlowCard';
import { MonoText } from '../../src/components/MonoText';
import { PillButton } from '../../src/components/PillButton';
import { BottomSheet } from '../../src/components/BottomSheet';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';
import {
  formatIndianCurrency,
  getDaysLeft,
  formatDate,
} from '../../src/lib/mockData';
import { deleteReceipt, getReceipt } from '../../lib/api';
import { publish } from '../../src/lib/eventBus';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState(false);
  const [deleteSheet, setDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  const loadReceipt = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getReceipt(id);
      setReceipt({
        ...data,
        date: new Date(data.date),
        returnDeadline: data.returnDeadline ? new Date(data.returnDeadline) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Receipt not found');
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  useEffect(() => {
    if (!receipt?.returnDeadline) return;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = receipt.returnDeadline!.getTime();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [receipt]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Loading receipt...</Text>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Receipt not found'}</Text>
      </SafeAreaView>
    );
  }

  const daysLeft = getDaysLeft(receipt.returnDeadline);
  const warrantyDaysLeft = getDaysLeft(receipt.warrantyExpiry);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backBtn}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={Colors.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>{receipt.store}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Receipt Image */}
        <Pressable
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setImageModal(true);
          }}
        >
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📄</Text>
              <Text style={styles.imagePlaceholderLabel}>Receipt Image</Text>
            </View>
            {receipt.aiExtracted && (
              <View style={styles.extractedBadge}>
                <Text style={styles.extractedText}>
                  ✦ Extracted by Gemini 2.0 Flash
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Key Info Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlowCard style={styles.infoCard}>
            <Text style={styles.storeName}>{receipt.store}</Text>
            <View style={styles.metaRow}>
              <MonoText style={styles.dateText}>{formatDate(receipt.date)}</MonoText>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{receipt.category}</Text>
              </View>
            </View>
            <MonoText style={styles.totalAmount}>
              {formatIndianCurrency(receipt.amount)}
            </MonoText>
            <View style={styles.paymentPill}>
              <Text style={styles.paymentText}>{receipt.paymentMode}</Text>
            </View>
          </GlowCard>
        </Animated.View>

        {/* Deadline Card */}
        {receipt.returnDeadline && daysLeft !== null && daysLeft >= 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlowCard glowColor="amber" style={styles.deadlineCard}>
              <Text style={styles.deadlineLabel}>Return Window</Text>
              <View style={styles.countdownRow}>
                <View style={styles.countdownTile}>
                  <MonoText style={styles.countdownValue}>{countdown.days}</MonoText>
                  <Text style={styles.countdownUnit}>Days</Text>
                </View>
                <Text style={styles.countdownSep}>|</Text>
                <View style={styles.countdownTile}>
                  <MonoText style={styles.countdownValue}>{countdown.hours}</MonoText>
                  <Text style={styles.countdownUnit}>Hours</Text>
                </View>
                <Text style={styles.countdownSep}>|</Text>
                <View style={styles.countdownTile}>
                  <MonoText style={styles.countdownValue}>{countdown.minutes}</MonoText>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
              </View>
              <MonoText style={styles.expiresOn}>
                Expires on {formatDate(receipt.returnDeadline)}
              </MonoText>
            </GlowCard>
          </Animated.View>
        )}

        {/* Warranty Card */}
        {receipt.warrantyExpiry && warrantyDaysLeft !== null && warrantyDaysLeft > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlowCard glowColor="emerald" style={styles.warrantyCard}>
              <Text style={styles.warrantyLabel}>Warranty</Text>
              <View style={styles.warrantyRow}>
                <MonoText style={styles.warrantyDate}>
                  Expires {formatDate(receipt.warrantyExpiry)}
                </MonoText>
                <MonoText style={styles.warrantyDays}>
                  {warrantyDaysLeft} days remaining
                </MonoText>
              </View>
            </GlowCard>
          </Animated.View>
        )}

        {/* Itemized Table */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.itemsTitle}>Products In This Receipt</Text>
          {(receipt.items || []).length === 0 ? (
            <View style={styles.itemsEmptyRow}>
              <Text style={styles.itemsEmptyText}>
                No product details were extracted for this receipt.
              </Text>
            </View>
          ) : (
            (receipt.items || []).map((item: { name: string; quantity: number; price: number }, index: number) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor:
                      index % 2 === 0 ? Colors.bgSecondary : Colors.bgTertiary,
                  },
                ]}
              >
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <MonoText style={styles.itemPrice}>
                  {formatIndianCurrency(item.price)}
                </MonoText>
              </View>
            ))
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <MonoText style={styles.totalValue}>
              {formatIndianCurrency(receipt.amount)}
            </MonoText>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <PillButton
          label="Share via WhatsApp"
          variant="whatsapp"
          onPress={() => Linking.openURL('https://wa.me/')}
        />
        <View style={styles.actionRow}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={styles.secondaryBtnText}>Re-extract with AI</Text>
          </Pressable>
          <Pressable
            style={styles.dangerBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setDeleteSheet(true);
            }}
          >
            <Text style={styles.dangerBtnText}>Delete</Text>
          </Pressable>
        </View>
      </View>

      {/* Full-screen image viewer */}
      <Modal visible={imageModal} animationType="fade" statusBarTranslucent>
        <View style={styles.imageViewerContainer}>
          <Pressable
            style={styles.imageViewerClose}
            onPress={() => setImageModal(false)}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.imageViewerPlaceholder}>
            <Text style={styles.imagePlaceholderText}>📄</Text>
            <Text style={[styles.imagePlaceholderLabel, { color: '#FFF' }]}>
              {receipt.store} Receipt
            </Text>
          </View>
        </View>
      </Modal>

      {/* Delete confirmation */}
      <BottomSheet
        visible={deleteSheet}
        onClose={() => setDeleteSheet(false)}
        title="Delete Receipt"
        height={220}
      >
        <Text style={styles.deleteWarning}>
          This cannot be undone. The receipt and all associated data will be
          permanently deleted.
        </Text>
        <View style={styles.deleteActions}>
          <PillButton
            label="Cancel"
            variant="secondary"
            onPress={() => setDeleteSheet(false)}
            style={{ flex: 1 }}
          />
          <PillButton
            label="Delete"
            variant="danger"
            onPress={async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              try {
                setDeleting(true);
                await deleteReceipt(receipt.id);
                publish('data:updated');
                setDeleteSheet(false);
                router.back();
              } catch (e: any) {
                setError(e?.response?.data?.error || e?.message || 'Delete failed');
              } finally {
                setDeleting(false);
              }
            }}
            style={{ flex: 1 }}
            disabled={deleting}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  imagePlaceholderLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  extractedBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(183,148,244,0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  extractedText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentPurple,
  },
  infoCard: {
    marginBottom: 12,
    padding: 20,
  },
  storeName: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  categoryPill: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 42,
    color: Colors.accentCyan,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentPill: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  paymentText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  deadlineCard: {
    marginBottom: 12,
    padding: 20,
  },
  deadlineLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.accentAmber,
    marginBottom: 12,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  countdownTile: {
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  countdownValue: {
    fontSize: FontSizes.xxl,
    color: Colors.accentAmber,
    fontWeight: 'bold',
  },
  countdownUnit: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  countdownSep: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xl,
    color: Colors.textMuted,
  },
  expiresOn: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  warrantyCard: {
    marginBottom: 12,
    padding: 20,
  },
  warrantyLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.accentEmerald,
    marginBottom: 8,
  },
  warrantyRow: {
    gap: 4,
  },
  warrantyDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  warrantyDays: {
    fontSize: FontSizes.sm,
    color: Colors.accentEmerald,
  },
  itemsTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  itemsEmptyRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSecondary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  itemsEmptyText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  itemName: {
    flex: 1,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  itemQty: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: FontSizes.sm,
    color: Colors.accentCyan,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSizes.md,
    color: Colors.accentCyan,
    fontWeight: 'bold',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentPurple,
  },
  dangerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.accentRose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentRose,
  },
  errorText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: '#FFF',
  },
  imageViewerPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  deleteWarning: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
