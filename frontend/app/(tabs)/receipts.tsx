import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonoText } from '../../src/components/MonoText';
import { DeadlineBadge } from '../../src/components/DeadlineBadge';
import { VaultLogo } from '../../src/components/VaultLogo';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';
import { useData, Receipt } from '../../src/hooks/useData';
import {
  formatIndianCurrency,
  getDaysLeft,
  formatDate,
  getCategoryColor,
} from '../../src/lib/mockData';

const CATEGORIES = ['All', 'Electronics', 'Food', 'Fashion', 'Groceries', 'Health', 'Other'];

export default function ReceiptsScreen() {
  const router = useRouter();
  const { receipts, loading, error, refetch } = useData();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchesCategory =
        activeCategory === 'All' || r.category === activeCategory;
      const matchesSearch =
        !search ||
        r.store.toLowerCase().includes(search.toLowerCase()) ||
        r.item.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [receipts, activeCategory, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderRightActions = () => (
    <View style={styles.swipeAction}>
      <LinearGradient
        colors={['#E53E3E', Colors.accentRose]}
        style={styles.swipeGradient}
      >
        <Text style={styles.swipeText}>Delete</Text>
      </LinearGradient>
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.swipeAction}>
      <LinearGradient
        colors={Colors.gradientCyan as unknown as [string, string]}
        style={styles.swipeGradient}
      >
        <Text style={styles.swipeText}>Share</Text>
      </LinearGradient>
    </View>
  );

  const renderItem = ({ item, index }: { item: Receipt; index: number }) => {
    const daysLeft = getDaysLeft(item.returnDeadline);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).duration(300)}
      >
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={(direction) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/receipt/${item.id}`);
            }}
          >
            <View style={styles.receiptRow}>
              <View
                style={[
                  styles.storeCircle,
                  {
                    backgroundColor:
                      getCategoryColor(item.category) + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.storeInitial,
                    { color: getCategoryColor(item.category) },
                  ]}
                >
                  {item.storeLogo}
                </Text>
              </View>
              <View style={styles.receiptInfo}>
                <Text style={styles.storeName}>{item.store}</Text>
                <MonoText style={styles.receiptDate}>
                  {formatDate(item.date)}
                </MonoText>
              </View>
              <View style={styles.receiptRight}>
                <MonoText style={styles.receiptAmount}>
                  {formatIndianCurrency(item.amount)}
                </MonoText>
                <DeadlineBadge daysLeft={daysLeft} />
              </View>
            </View>
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  const ListEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.accentCyan} />
          <Text style={styles.emptyTitle}>Loading receipts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Error loading receipts</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <VaultLogo size={64} animated={false} />
        <Text style={styles.emptyTitle}>No receipts found</Text>
        <Text style={styles.emptySubtext}>
          Try a different filter or send a photo on WhatsApp
        </Text>
        <Pressable
          style={styles.whatsappBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL('https://wa.me/');
          }}
        >
          <LinearGradient
            colors={['#25D366', '#128C7E']}
            style={styles.whatsappGradient}
          >
            <Text style={styles.whatsappText}>Open WhatsApp</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Receipts</Text>
          <View style={styles.totalPill}>
            <Text style={styles.totalText}>{filteredReceipts.length} total</Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            searchFocused && styles.searchBarFocused,
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke={Colors.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores, items..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(cat);
              }}
            >
              {activeCategory === cat ? (
                <LinearGradient
                  colors={Colors.gradientCyan as unknown as [string, string]}
                  style={styles.categoryPill}
                >
                  <Text style={styles.categoryActiveText}>{cat}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryPillInactive}>
                  <Text style={styles.categoryInactiveText}>{cat}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredReceipts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentCyan}
            colors={[Colors.accentCyan]}
            progressBackgroundColor={Colors.bgSecondary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xxl - 2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  totalPill: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 12,
  },
  searchBarFocused: {
    borderColor: Colors.borderActive,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillInactive: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  categoryActiveText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.bgPrimary,
  },
  categoryInactiveText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    height: 80,
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
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm + 1,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  receiptDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  receiptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  receiptAmount: {
    fontSize: FontSizes.md,
    color: Colors.accentCyan,
    fontWeight: 'bold',
  },
  swipeAction: {
    justifyContent: 'center',
    marginBottom: 8,
  },
  swipeGradient: {
    height: '100%',
    width: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  whatsappBtn: {
    marginTop: 16,
    width: 200,
  },
  whatsappGradient: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm,
    color: '#FFF',
  },
});
