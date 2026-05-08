import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowCard } from '../../src/components/GlowCard';
import { MonoText } from '../../src/components/MonoText';
import { BottomSheet } from '../../src/components/BottomSheet';
import { PillButton } from '../../src/components/PillButton';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';
import { useData } from '../../src/hooks/useData';
import { formatIndianCurrency } from '../../src/lib/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERIODS = ['Week', 'Month', 'Year'] as const;

export default function SpendingScreen() {
  const { spendingByWeek, spendingByMonth, categoryBreakdown, topMerchants, loading, refetch } = useData();
  const [activePeriod, setActivePeriod] = useState<typeof PERIODS[number]>('Week');
  const [askSheetVisible, setAskSheetVisible] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const chartData = useMemo(() => {
    switch (activePeriod) {
      case 'Week':
        return (spendingByWeek.length > 0 ? spendingByWeek : [
          { day: 'Mon', amount: 0 },
          { day: 'Tue', amount: 0 },
          { day: 'Wed', amount: 0 },
          { day: 'Thu', amount: 0 },
          { day: 'Fri', amount: 0 },
          { day: 'Sat', amount: 0 },
          { day: 'Sun', amount: 0 },
        ]).map((d) => ({
          label: d.day || '',
          amount: Number(d.amount || 0),
        }));
      case 'Month':
        return spendingByMonth.map((d) => ({
          label: d.month || '',
          amount: Number(d.amount || 0),
        }));
      case 'Year':
        return spendingByMonth.map((d) => ({
          label: d.month || '',
          amount: Number(d.amount || 0),
        }));
    }
  }, [activePeriod, spendingByWeek, spendingByMonth]);

  const totalForPeriod = useMemo(
    () => chartData.reduce((s, d) => s + d.amount, 0),
    [chartData]
  );

  const maxAmount = useMemo(
    () => Math.max(...chartData.map((d) => d.amount), 1),
    [chartData]
  );

  const maxCategory = useMemo(
    () => Math.max(...categoryBreakdown.map((c) => c.percent), 1),
    [categoryBreakdown]
  );

  const maxMerchant = useMemo(
    () => Math.max(...topMerchants.map((m) => m.amount), 1),
    [topMerchants]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const chartW = SCREEN_WIDTH - 72;
  const hasSpend = chartData.some((d) => d.amount > 0);
  const points = chartData.map((d, i) => {
    const x = chartData.length === 1 ? chartW / 2 : (i / (chartData.length - 1)) * chartW;
    const y = hasSpend ? 170 - (d.amount / maxAmount) * 140 : 150;
    return { x, y };
  });
  const linePath = `M${points.map((p) => `${p.x},${p.y}`).join(' L')}`;
  const areaPath = `${linePath} L${chartW},200 L0,200 Z`;

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
        <Text style={styles.title}>Spending</Text>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((period) => (
            <Pressable
              key={period}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActivePeriod(period);
              }}
            >
              {activePeriod === period ? (
                <LinearGradient
                  colors={Colors.gradientCyan as unknown as [string, string]}
                  style={styles.periodPill}
                >
                  <Text style={styles.periodActiveText}>{period}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.periodPillInactive}>
                  <Text style={styles.periodInactiveText}>{period}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Hero Chart */}
        <GlowCard style={styles.chartCard}>
          <Svg width="100%" height={200} viewBox={`0 0 ${chartW} 200`}>
            <Path d={areaPath} fill={Colors.accentCyan} opacity={hasSpend ? 0.15 : 0.08} />
            <Path
              d={linePath}
              stroke={Colors.accentCyan}
              strokeWidth={hasSpend ? 2.5 : 3}
              strokeDasharray={hasSpend ? undefined : "8 8"}
              opacity={hasSpend ? 1 : 0.95}
              fill="none"
            />
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hasSpend ? 3 : 4}
                fill={Colors.accentCyan}
                opacity={hasSpend ? 1 : 0.75}
              />
            ))}
          </Svg>
          {!hasSpend && (
            <View style={styles.emptyChartOverlay}>
              <Text style={styles.emptyChartTitle}>No spending in this period</Text>
              <Text style={styles.emptyChartSubtitle}>Add receipts dated in this period to see the trend.</Text>
            </View>
          )}
          <View style={styles.chartLabels}>
            {chartData.map((d) => (
              <Text key={d.label} style={styles.chartLabel}>
                {d.label}
              </Text>
            ))}
          </View>
        </GlowCard>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total for {activePeriod}</Text>
          <MonoText style={styles.totalAmount}>
            {formatIndianCurrency(totalForPeriod)}
          </MonoText>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Where Your Money Goes</Text>
        {categoryBreakdown.map((cat, index) => (
          <Animated.View
            key={cat.name}
            entering={FadeInDown.delay(index * 60).duration(300)}
          >
            <View style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
              <View style={styles.categoryCenter}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(cat.percent / maxCategory) * 100}%`,
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryRight}>
                <MonoText style={styles.categoryAmount}>
                  {formatIndianCurrency(cat.amount)}
                </MonoText>
                <Text style={styles.categoryPercent}>{cat.percent}%</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {/* Top Merchants */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Your Top Stores
        </Text>
        {topMerchants.map((merchant, index) => (
          <Animated.View
            key={merchant.store}
            entering={FadeInDown.delay(index * 60 + 300).duration(300)}
          >
            <View style={styles.merchantRow}>
              <MonoText style={styles.merchantRank}>{merchant.rank}</MonoText>
              <Text style={styles.merchantName}>{merchant.store}</Text>
              <View style={styles.merchantBarContainer}>
                <View
                  style={[
                    styles.merchantBar,
                    {
                      width: `${(merchant.amount / maxMerchant) * 100}%`,
                    },
                  ]}
                />
              </View>
              <MonoText style={styles.merchantAmount}>
                {formatIndianCurrency(merchant.amount)}
              </MonoText>
            </View>
          </Animated.View>
        ))}

        {/* AI Insight Card */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <GlowCard glowColor="purple" style={styles.insightCard}>
            <Text style={styles.insightHeader}>✦ AI Insight</Text>
            <Text style={styles.insightText}>
              You spent 34% more at Zomato this week vs your usual. Weekend
              orders are your biggest food category. Consider setting a weekly
              food budget to track spending better.
            </Text>
            <Pressable
              style={styles.askRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAskSheetVisible(true);
              }}
            >
              <Text style={styles.askText}>Ask about my spending →</Text>
            </Pressable>
          </GlowCard>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Ask Bottom Sheet */}
      <BottomSheet
        visible={askSheetVisible}
        onClose={() => setAskSheetVisible(false)}
        title="Ask about your spending"
        height={280}
      >
        <TextInput
          style={styles.askInput}
          placeholder="e.g., How much did I spend on food this month?"
          placeholderTextColor={Colors.textMuted}
          value={askQuery}
          onChangeText={setAskQuery}
          multiline
        />
        <PillButton
          label="Ask ✦"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAskSheetVisible(false);
            setAskQuery('');
          }}
        />
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
    paddingTop: 8,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xxl - 2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodPill: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillInactive: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  periodActiveText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.bgPrimary,
  },
  periodInactiveText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  chartCard: {
    padding: 16,
    marginBottom: 8,
    position: 'relative',
  },
  emptyChartOverlay: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  emptyChartTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  emptyChartSubtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  totalLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: FontSizes.xxxl + 2,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  categoryCenter: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgTertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  categoryAmount: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  categoryPercent: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  merchantRank: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    width: 20,
  },
  merchantName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    width: 100,
  },
  merchantBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgTertiary,
    overflow: 'hidden',
  },
  merchantBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accentCyan,
  },
  merchantAmount: {
    fontSize: FontSizes.sm,
    color: Colors.accentCyan,
    width: 80,
    textAlign: 'right',
  },
  insightCard: {
    marginTop: 24,
    padding: 20,
  },
  insightHeader: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.accentPurple,
    marginBottom: 10,
  },
  insightText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  askRow: {
    paddingVertical: 8,
  },
  askText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentPurple,
  },
  askInput: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 14,
    padding: 14,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
});
