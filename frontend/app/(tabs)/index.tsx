import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowCard } from '../../src/components/GlowCard';
import { MonoText } from '../../src/components/MonoText';
import { DeadlineBadge } from '../../src/components/DeadlineBadge';
import { VaultLogo } from '../../src/components/VaultLogo';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';
import { useData } from '../../src/hooks/useData';
import { useAuth } from '../../context/AuthContext';
import {
  formatIndianCurrency,
  getDaysLeft,
  formatDate,
  getCategoryColor,
} from '../../src/lib/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ClockIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={color} strokeWidth={2} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ShieldIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrendingUpIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 6h6v6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BellIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function HomeScreen() {
  const router = useRouter();
  const { userPhone, user, linkedProfile } = useAuth();
  const { receipts, spendingByWeek, dashboardStats, loading, refetch } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const displayIdentity = useMemo(() => {
    const displayName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      linkedProfile?.displayName;
    if (displayName && displayName.trim().length > 0) return displayName;
    if (!userPhone) return 'Welcome';
    if (userPhone.startsWith('+')) return userPhone;
    if (userPhone.length === 10) return `+91 ${userPhone}`;
    if (userPhone.length === 12 && userPhone.startsWith('91')) return `+${userPhone}`;
    return userPhone;
  }, [linkedProfile?.displayName, user?.user_metadata?.full_name, user?.user_metadata?.name, userPhone]);

  const deadlineReceipts = useMemo(
    () =>
      receipts
        .filter((r) => r.returnDeadline && getDaysLeft(r.returnDeadline)! >= 0)
        .sort((a, b) => getDaysLeft(a.returnDeadline)! - getDaysLeft(b.returnDeadline)!)
        .slice(0, 3),
    [receipts]
  );

  const recentReceipts = useMemo(
    () =>
      [...receipts].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      ).slice(0, 6),
    [receipts]
  );

  const expiringCount = useMemo(
    () =>
      receipts.filter(
        (r) => r.returnDeadline && getDaysLeft(r.returnDeadline)! >= 0 && getDaysLeft(r.returnDeadline)! <= 7
      ).length,
    [receipts]
  );

  const protectedCount = useMemo(
    () =>
      receipts.filter(
        (r) => r.warrantyExpiry && getDaysLeft(r.warrantyExpiry)! > 0
      ).length,
    [receipts]
  );

  const computedThisWeekTotal = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return receipts
      .filter((r) => r.date >= sevenDaysAgo && r.date <= now)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [receipts]);

  const thisWeekTotal = useMemo(() => {
    const chartTotal = spendingByWeek.reduce((sum, d) => sum + d.amount, 0);
    return computedThisWeekTotal > 0 ? computedThisWeekTotal : chartTotal;
  }, [computedThisWeekTotal, spendingByWeek]);

  const weeklyChartData = useMemo(
    () =>
      spendingByWeek.length > 0 ? spendingByWeek : [
        { day: 'Mon', amount: 0 },
        { day: 'Tue', amount: 0 },
        { day: 'Wed', amount: 0 },
        { day: 'Thu', amount: 0 },
        { day: 'Fri', amount: 0 },
        { day: 'Sat', amount: 0 },
        { day: 'Sun', amount: 0 },
      ],
    [spendingByWeek]
  );

  const hasWeeklySpend = useMemo(
    () => weeklyChartData.some((d) => Number(d.amount || 0) > 0),
    [weeklyChartData]
  );

  const monthSummary = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const currentMonthReceipts = receipts
      .filter((r) => r.date.getMonth() === month && r.date.getFullYear() === year)
      .filter((r) => !Number.isNaN(r.date.getTime()));

    if (currentMonthReceipts.length > 0) {
      return {
        total: currentMonthReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0),
        count: currentMonthReceipts.length,
        label: 'TOTAL SPENT THIS MONTH',
      };
    }

    const validReceipts = receipts
      .filter((r) => !Number.isNaN(r.date.getTime()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (validReceipts.length === 0) {
      return { total: 0, count: 0, label: 'TOTAL SPENT THIS MONTH' };
    }

    const latest = validReceipts[0].date;
    const latestMonthReceipts = validReceipts.filter(
      (r) => r.date.getMonth() === latest.getMonth() && r.date.getFullYear() === latest.getFullYear()
    );
    const monthName = latest.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase();

    return {
      total: latestMonthReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      count: latestMonthReceipts.length,
      label: `TOTAL SPENT ${monthName}`,
    };
  }, [receipts]);

  const thisMonthSpend = useMemo(() => {
    if (typeof dashboardStats?.thisMonthSpend === 'number' && dashboardStats.thisMonthSpend > 0) {
      return dashboardStats.thisMonthSpend;
    }
    return monthSummary.total;
  }, [monthSummary.total, dashboardStats?.thisMonthSpend]);

  const thisMonthReceiptCount = monthSummary.count;

  const monthComparisonText = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastMonthYear = month === 0 ? year - 1 : year;

    const lastMonthTotal = receipts
      .filter((r) => r.date.getMonth() === lastMonth && r.date.getFullYear() === lastMonthYear)
      .reduce((sum, r) => sum + r.amount, 0);

    if (lastMonthTotal <= 0) {
      return 'Live data';
    }

    const diffPercent = ((thisMonthSpend - lastMonthTotal) / lastMonthTotal) * 100;
    const trend = diffPercent >= 0 ? '↑' : '↓';
    return `${trend} ${Math.abs(diffPercent).toFixed(0)}% vs last month`;
  }, [receipts, thisMonthSpend]);

  // Stagger animations
  const card1Opacity = useSharedValue(0);
  const card2Opacity = useSharedValue(0);
  const card3Opacity = useSharedValue(0);
  const card1Y = useSharedValue(20);
  const card2Y = useSharedValue(20);
  const card3Y = useSharedValue(20);

  // Bell swing
  const bellRotation = useSharedValue(0);

  // Gemini pulse
  const geminiPulse = useSharedValue(0.6);

  useEffect(() => {
    card1Opacity.value = withDelay(0, withTiming(1, { duration: 400 }));
    card1Y.value = withDelay(0, withSpring(0, { damping: 15 }));

    card2Opacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    card2Y.value = withDelay(100, withSpring(0, { damping: 15 }));

    card3Opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    card3Y.value = withDelay(200, withSpring(0, { damping: 15 }));

    bellRotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    geminiPulse.value = withRepeat(
      withTiming(1, { duration: 1250 }),
      -1,
      true
    );
  }, []);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.value}deg` }],
  }));

  const geminiStyle = useAnimatedStyle(() => ({
    opacity: geminiPulse.value,
  }));

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));
  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateY: card3Y.value }],
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Ambient blobs */}
      <View style={styles.blobCyan} />
      <View style={styles.blobPurple} />

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
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.userName}>{displayIdentity}</Text>
          </View>
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Animated.View style={bellStyle}>
              <BellIcon color={Colors.textSecondary} size={24} />
              <View style={styles.bellDot} />
            </Animated.View>
          </Pressable>
        </View>

        {/* Gemini Active Pill */}
        <Animated.View style={[styles.geminiPill, geminiStyle]}>
          <Text style={styles.geminiText}>✦ Gemini Active</Text>
        </Animated.View>

        {/* Hero Stat Card */}
        <GlowCard style={styles.heroCard}>
          <Text style={styles.heroLabel}>{monthSummary.label}</Text>
          <MonoText style={styles.heroAmount}>
            {formatIndianCurrency(thisMonthSpend)}
          </MonoText>
          <View style={styles.heroPills}>
            <View style={styles.changePill}>
              <Text style={styles.changeText}>{monthComparisonText}</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{thisMonthReceiptCount} receipts</Text>
            </View>
          </View>
          {/* Mini sparkline area */}
          <View style={styles.sparkline}>
            <Svg width="100%" height={48} viewBox={`0 0 ${SCREEN_WIDTH - 80} 48`}>
              <Path
                d={`M0,40 L${(SCREEN_WIDTH - 80) * 0.14},25 L${(SCREEN_WIDTH - 80) * 0.28},30 L${(SCREEN_WIDTH - 80) * 0.42},15 L${(SCREEN_WIDTH - 80) * 0.56},20 L${(SCREEN_WIDTH - 80) * 0.71},8 L${(SCREEN_WIDTH - 80) * 0.85},12 L${SCREEN_WIDTH - 80},18`}
                stroke={Colors.accentCyan}
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d={`M0,40 L${(SCREEN_WIDTH - 80) * 0.14},25 L${(SCREEN_WIDTH - 80) * 0.28},30 L${(SCREEN_WIDTH - 80) * 0.42},15 L${(SCREEN_WIDTH - 80) * 0.56},20 L${(SCREEN_WIDTH - 80) * 0.71},8 L${(SCREEN_WIDTH - 80) * 0.85},12 L${SCREEN_WIDTH - 80},18 L${SCREEN_WIDTH - 80},48 L0,48 Z`}
                fill={Colors.accentCyan}
                opacity={0.15}
              />
            </Svg>
          </View>
        </GlowCard>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Animated.View style={[{ flex: 1 }, card1Style]}>
            <GlowCard glowColor="amber" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(246,173,85,0.2)' }]}>
                  <ClockIcon color={Colors.accentAmber} size={18} />
                </View>
                <MonoText style={[styles.statValue, { color: Colors.accentAmber }]}>
                  {expiringCount}
                </MonoText>
                <Text style={styles.statLabel}>Expiring Soon</Text>
              </View>
            </GlowCard>
          </Animated.View>

          <Animated.View style={[{ flex: 1 }, card2Style]}>
            <GlowCard glowColor="emerald" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(104,211,145,0.2)' }]}>
                  <ShieldIcon color={Colors.accentEmerald} size={18} />
                </View>
                <MonoText style={[styles.statValue, { color: Colors.accentEmerald }]}>
                  {protectedCount}
                </MonoText>
                <Text style={styles.statLabel}>Protected</Text>
              </View>
            </GlowCard>
          </Animated.View>

          <Animated.View style={[{ flex: 1 }, card3Style]}>
            <GlowCard style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(99,179,237,0.2)' }]}>
                  <TrendingUpIcon color={Colors.accentCyan} size={18} />
                </View>
                <MonoText style={[styles.statValue, { color: Colors.accentCyan }]}>
                  {formatIndianCurrency(thisWeekTotal)}
                </MonoText>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </GlowCard>
          </Animated.View>
        </View>

        {/* Deadline Alerts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Deadline Watch</Text>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/deadlines');
          }}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {deadlineReceipts.map((receipt, index) => {
          const daysLeft = getDaysLeft(receipt.returnDeadline);
          const isUrgent = daysLeft !== null && daysLeft <= 1;
          const urgencyColor =
            daysLeft !== null && daysLeft <= 1
              ? Colors.accentRose
              : daysLeft !== null && daysLeft <= 7
              ? Colors.accentAmber
              : Colors.accentCyan;

          return (
            <Pressable
              key={receipt.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/receipt/${receipt.id}`);
              }}
            >
              <View
                style={[
                  styles.deadlineCard,
                  isUrgent && styles.deadlineCardUrgent,
                ]}
              >
                <View style={styles.deadlineLeft}>
                  <View
                    style={[styles.urgencyDot, { backgroundColor: urgencyColor }]}
                  />
                  <View>
                    <Text style={styles.deadlineStore}>{receipt.store}</Text>
                    <Text style={styles.deadlineItem}>{receipt.item}</Text>
                  </View>
                </View>
                <View style={styles.deadlineRight}>
                  <MonoText style={[styles.deadlineDays, { color: urgencyColor }]}>
                    {daysLeft}d left
                  </MonoText>
                  <DeadlineBadge daysLeft={daysLeft} />
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Recent Receipts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Receipts</Text>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/receipts');
          }}>
            <Text style={styles.seeAll}>View All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.receiptScroll}
        >
          {recentReceipts.map((receipt) => (
            <Pressable
              key={receipt.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/receipt/${receipt.id}`);
              }}
            >
              <GlowCard style={styles.receiptCard}>
                <View style={styles.receiptTop}>
                  <View
                    style={[
                      styles.storeCircle,
                      { backgroundColor: getCategoryColor(receipt.category) + '30' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.storeInitial,
                        { color: getCategoryColor(receipt.category) },
                      ]}
                    >
                      {receipt.storeLogo}
                    </Text>
                  </View>
                  <View style={styles.receiptMeta}>
                    <Text style={styles.receiptStore} numberOfLines={1}>
                      {receipt.store}
                    </Text>
                    <MonoText style={styles.receiptDate}>
                      {formatDate(receipt.date)}
                    </MonoText>
                  </View>
                  {receipt.aiExtracted && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>✦ AI</Text>
                    </View>
                  )}
                </View>
                <View style={styles.receiptBottom}>
                  <MonoText style={styles.receiptAmount}>
                    {formatIndianCurrency(receipt.amount)}
                  </MonoText>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{receipt.category}</Text>
                  </View>
                </View>
              </GlowCard>
            </Pressable>
          ))}
        </ScrollView>

        {/* Spending Chart */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spending This Week</Text>
        </View>

        <GlowCard style={styles.chartCard}>
          {/* Pure View bar chart — no SVG */}
          {(() => {
            const maxAmt = Math.max(...weeklyChartData.map((d) => Number(d.amount || 0)), 1);
            const BAR_HEIGHT = 120;
            return (
              <View style={styles.barChartRow}>
                {weeklyChartData.map((d) => {
                  const amt = Number(d.amount || 0);
                  const barH = hasWeeklySpend ? Math.max((amt / maxAmt) * BAR_HEIGHT, 4) : 4;
                  return (
                    <View key={d.day} style={styles.barChartCol}>
                      {amt > 0 && (
                        <Text style={styles.barAmtLabel}>
                          {amt >= 1000 ? `₹${(amt / 1000).toFixed(1)}k` : `₹${amt}`}
                        </Text>
                      )}
                      <View style={[styles.barTrack, { height: BAR_HEIGHT }]}>
                        <LinearGradient
                          colors={amt > 0 ? (Colors.gradientCyan as unknown as [string, string]) : ['rgba(100,200,255,0.25)', 'rgba(100,200,255,0.08)']}
                          style={[styles.bar, { height: barH }]}
                        />
                      </View>
                      <Text style={styles.barDayLabel}>{d.day}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          {!hasWeeklySpend && (
            <Text style={styles.barEmptyHint}>No spending this week yet</Text>
          )}
        </GlowCard>

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
  blobCyan: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 9999,
    backgroundColor: Colors.accentCyan,
    opacity: 0.07,
  },
  blobPurple: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 9999,
    backgroundColor: Colors.accentPurple,
    opacity: 0.05,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  userName: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentRose,
  },
  geminiPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(183,148,244,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(183,148,244,0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
    marginTop: 8,
  },
  geminiText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentPurple,
  },
  heroCard: {
    height: 200,
    marginBottom: 12,
    padding: 20,
  },
  heroLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: FontSizes.hero,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  changePill: {
    backgroundColor: 'rgba(246,173,85,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentAmber,
  },
  countPill: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  sparkline: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    padding: 12,
  },
  statContent: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSizes.xxl - 2,
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentCyan,
  },
  deadlineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  deadlineCardUrgent: {
    borderColor: 'rgba(252,129,129,0.3)',
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deadlineStore: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm + 1,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  deadlineItem: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deadlineRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deadlineDays: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  receiptScroll: {
    paddingRight: 20,
    gap: 10,
  },
  receiptCard: {
    width: 220,
    height: 140,
    padding: 14,
    justifyContent: 'space-between',
  },
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInitial: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm,
    letterSpacing: -0.3,
  },
  receiptMeta: {
    flex: 1,
  },
  receiptStore: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  receiptDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiBadge: {
    backgroundColor: 'rgba(183,148,244,0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.accentPurple,
  },
  receiptBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  receiptAmount: {
    fontSize: FontSizes.xl,
    color: Colors.accentCyan,
    fontWeight: 'bold',
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
  chartCard: {
    padding: 16,
    marginBottom: 8,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  barChartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barAmtLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.accentCyan,
  },
  barTrack: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: 'rgba(100,200,255,0.06)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barDayLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  barEmptyHint: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
