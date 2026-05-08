import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  FadeInRight,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowCard } from '../../src/components/GlowCard';
import { MonoText } from '../../src/components/MonoText';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';
import { useData } from '../../src/hooks/useData';
import {
  formatIndianCurrency,
  getDaysLeft,
  formatDate,
} from '../../src/lib/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DeadlinesScreen() {
  const router = useRouter();
  const { receipts, loading, refetch } = useData();
  const [activeView, setActiveView] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [cardStackIndex, setCardStackIndex] = useState(0);

  const deadlineReceipts = useMemo(
    () =>
      receipts
        .filter((r) => r.returnDeadline)
        .map((r) => ({
          ...r,
          daysLeft: getDaysLeft(r.returnDeadline),
        }))
        .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)),
    [receipts]
  );

  const todayCount = useMemo(
    () =>
      deadlineReceipts.filter(
        (r) => r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 1
      ).length,
    [deadlineReceipts]
  );

  const weekCount = useMemo(
    () =>
      deadlineReceipts.filter(
        (r) => r.daysLeft !== null && r.daysLeft > 1 && r.daysLeft <= 7
      ).length,
    [deadlineReceipts]
  );

  const upcomingCount = useMemo(
    () =>
      deadlineReceipts.filter(
        (r) => r.daysLeft !== null && r.daysLeft > 7
      ).length,
    [deadlineReceipts]
  );

  const todayDotScale = useSharedValue(1);
  const todayDotOpacity = useSharedValue(1);

  useEffect(() => {
    todayDotScale.value = withRepeat(
      withTiming(1.6, { duration: 1000 }),
      -1,
      true
    );
    todayDotOpacity.value = withRepeat(
      withTiming(0, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: todayDotScale.value }],
    opacity: todayDotOpacity.value,
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSwipeCard = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCardStackIndex((prev) =>
      prev < deadlineReceipts.length - 1 ? prev + 1 : prev
    );
  };

  const getUrgencyColor = (daysLeft: number | null) => {
    if (daysLeft === null || daysLeft < 0) return Colors.textMuted;
    if (daysLeft <= 1) return Colors.accentRose;
    if (daysLeft <= 7) return Colors.accentAmber;
    return Colors.accentCyan;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentCyan}
            colors={[Colors.accentCyan]}
            progressBackgroundColor={Colors.bgSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              stroke={Colors.accentAmber}
              strokeWidth={2}
            />
            <Path
              d="M12 6v6l4 2"
              stroke={Colors.accentAmber}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.title}>Deadline Guardian</Text>
        </View>

        {/* Urgency Summary */}
        <View style={styles.summaryRow}>
          <GlowCard glowColor="rose" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryEmoji}>🔴</Text>
              <MonoText style={[styles.summaryCount, { color: Colors.accentRose }]}>
                {todayCount}
              </MonoText>
              <Text style={styles.summaryLabel}>Today</Text>
            </View>
          </GlowCard>
          <GlowCard glowColor="amber" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryEmoji}>🟡</Text>
              <MonoText style={[styles.summaryCount, { color: Colors.accentAmber }]}>
                {weekCount}
              </MonoText>
              <Text style={styles.summaryLabel}>This Week</Text>
            </View>
          </GlowCard>
          <GlowCard glowColor="emerald" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryEmoji}>🟢</Text>
              <MonoText style={[styles.summaryCount, { color: Colors.accentEmerald }]}>
                {upcomingCount}
              </MonoText>
              <Text style={styles.summaryLabel}>Upcoming</Text>
            </View>
          </GlowCard>
        </View>

        {/* View Switch */}
        <View style={styles.viewSwitch}>
          <Pressable
            style={[styles.viewTab, activeView === 0 && styles.viewTabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveView(0);
            }}
          >
            <Text
              style={[
                styles.viewTabText,
                activeView === 0 && styles.viewTabTextActive,
              ]}
            >
              Timeline
            </Text>
          </Pressable>
          <Pressable
            style={[styles.viewTab, activeView === 1 && styles.viewTabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveView(1);
            }}
          >
            <Text
              style={[
                styles.viewTabText,
                activeView === 1 && styles.viewTabTextActive,
              ]}
            >
              Card Stack
            </Text>
          </Pressable>
        </View>

        {activeView === 0 ? (
          /* TIMELINE VIEW */
          <View style={styles.timeline}>
            {/* Timeline line */}
            <View style={styles.timelineLine}>
              <LinearGradient
                colors={[Colors.accentCyan, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Today marker */}
            <View style={styles.todayMarker}>
              <View style={styles.todayDot} />
              <Animated.View style={[styles.todayRing, pulseRingStyle]} />
              <Text style={styles.todayLabel}>TODAY</Text>
            </View>

            {deadlineReceipts.map((receipt, index) => {
              const isExpired = receipt.daysLeft !== null && receipt.daysLeft < 0;
              const isToday =
                receipt.daysLeft !== null &&
                receipt.daysLeft >= 0 &&
                receipt.daysLeft <= 1;
              const urgencyColor = getUrgencyColor(receipt.daysLeft);

              return (
                <Animated.View
                  key={receipt.id}
                  entering={FadeInRight.delay(index * 80).duration(300)}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/receipt/${receipt.id}`);
                    }}
                  >
                    <View
                      style={[
                        styles.timelineCard,
                        { borderLeftColor: urgencyColor },
                        isExpired && styles.timelineCardExpired,
                        isToday && styles.timelineCardToday,
                      ]}
                    >
                      <View style={styles.timelineCardContent}>
                        <View style={styles.timelineCardLeft}>
                          <Text
                            style={[
                              styles.timelineStore,
                              isExpired && styles.expiredText,
                            ]}
                          >
                            {receipt.store}
                          </Text>
                          <Text style={styles.timelineItem}>{receipt.item}</Text>
                          <MonoText
                            style={[
                              styles.timelineDate,
                              isExpired ? styles.expiredDate : undefined,
                            ]}
                          >
                            {formatDate(receipt.returnDeadline!)}
                          </MonoText>
                        </View>
                        <View
                          style={[
                            styles.daysBadge,
                            { backgroundColor: urgencyColor + '20' },
                          ]}
                        >
                          <MonoText style={[styles.daysText, { color: urgencyColor }]}>
                            {receipt.daysLeft !== null && receipt.daysLeft < 0
                              ? `${Math.abs(receipt.daysLeft)}d ago`
                              : `${receipt.daysLeft}d`}
                          </MonoText>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          /* CARD STACK VIEW */
          <View style={styles.cardStack}>
            {cardStackIndex < deadlineReceipts.length ? (
              <>
                {/* Background cards */}
                {[2, 1, 0].map((offset) => {
                  const idx = cardStackIndex + offset;
                  if (idx >= deadlineReceipts.length) return null;
                  const receipt = deadlineReceipts[idx];
                  const isTop = offset === 0;
                  const scaleVal = 1 - offset * 0.05;
                  const translateVal = -offset * 8;

                  return (
                    <Animated.View
                      key={receipt.id}
                      style={[
                        styles.stackCard,
                        {
                          transform: [
                            { scale: scaleVal },
                            { translateY: translateVal },
                          ],
                          zIndex: 3 - offset,
                          opacity: isTop ? 1 : 0.7 - offset * 0.15,
                        },
                      ]}
                    >
                      <GlowCard
                        glowColor={
                          receipt.daysLeft !== null && receipt.daysLeft <= 1
                            ? 'rose'
                            : receipt.daysLeft !== null && receipt.daysLeft <= 7
                            ? 'amber'
                            : 'cyan'
                        }
                        style={styles.stackCardInner}
                      >
                        <Text style={styles.stackStore}>{receipt.store}</Text>
                        <Text style={styles.stackItem}>{receipt.item}</Text>
                        <MonoText style={styles.stackAmount}>
                          {formatIndianCurrency(receipt.amount)}
                        </MonoText>
                        <View style={styles.stackMeta}>
                          <MonoText
                            style={[
                              styles.stackDays,
                              {
                                color: getUrgencyColor(receipt.daysLeft),
                              },
                            ]}
                          >
                            {receipt.daysLeft !== null && receipt.daysLeft < 0
                              ? `Expired ${Math.abs(receipt.daysLeft)}d ago`
                              : `${receipt.daysLeft} days left`}
                          </MonoText>
                          <MonoText style={styles.stackDate}>
                            {formatDate(receipt.returnDeadline!)}
                          </MonoText>
                        </View>

                        {isTop && (
                          <View style={styles.stackActions}>
                            <Pressable
                              style={[styles.stackBtn, styles.stackBtnSkip]}
                              onPress={() => handleSwipeCard('left')}
                            >
                              <Text style={styles.stackBtnText}>← Skip</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.stackBtn, styles.stackBtnAck]}
                              onPress={() => handleSwipeCard('right')}
                            >
                              <Text style={styles.stackBtnAckText}>
                                Acknowledge ✓
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </GlowCard>
                    </Animated.View>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyStack}>
                <Text style={styles.emptyCheck}>✅</Text>
                <Text style={styles.emptyTitle}>All clear!</Text>
                <Text style={styles.emptySubtext}>
                  No urgent deadlines remaining.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* View indicator dots */}
        <View style={styles.dotsRow}>
          <View
            style={[styles.dot, activeView === 0 && styles.dotActive]}
          />
          <View
            style={[styles.dot, activeView === 1 && styles.dotActive]}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xxl - 2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
  },
  summaryContent: {
    alignItems: 'center',
    gap: 2,
  },
  summaryEmoji: {
    fontSize: 14,
  },
  summaryCount: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.bgTertiary,
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewTabActive: {
    backgroundColor: Colors.bgElevated,
  },
  viewTabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  viewTabTextActive: {
    color: Colors.accentCyan,
  },
  timeline: {
    paddingLeft: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  todayMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: -16,
  },
  todayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentCyan,
    zIndex: 2,
  },
  todayRing: {
    position: 'absolute',
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.accentCyan,
    zIndex: 1,
  },
  todayLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xs,
    color: Colors.accentCyan,
    marginLeft: 16,
    letterSpacing: 1.5,
  },
  timelineCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
    marginLeft: 8,
  },
  timelineCardExpired: {
    opacity: 0.6,
  },
  timelineCardToday: {
    borderWidth: 1,
    borderColor: 'rgba(246,173,85,0.3)',
  },
  timelineCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineCardLeft: {
    flex: 1,
  },
  timelineStore: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm + 1,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  expiredText: {
    color: Colors.textMuted,
  },
  timelineItem: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  expiredDate: {
    textDecorationLine: 'line-through',
  },
  daysBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  cardStack: {
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    width: SCREEN_WIDTH - 56,
    alignSelf: 'center',
  },
  stackCardInner: {
    padding: 24,
    minHeight: 260,
  },
  stackStore: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  stackItem: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  stackAmount: {
    fontSize: FontSizes.xxxl,
    color: Colors.accentCyan,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stackMeta: {
    gap: 4,
    marginBottom: 20,
  },
  stackDays: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  stackDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  stackActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stackBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackBtnSkip: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  stackBtnAck: {
    backgroundColor: 'rgba(104,211,145,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(104,211,145,0.3)',
  },
  stackBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  stackBtnAckText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentEmerald,
  },
  emptyStack: {
    alignItems: 'center',
    gap: 8,
  },
  emptyCheck: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.accentCyan,
    width: 18,
    borderRadius: 4,
  },
});
