import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';

interface DeadlineBadgeProps {
  daysLeft: number | null;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ daysLeft }) => {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (daysLeft !== null && daysLeft <= 1) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 800 }),
        -1,
        true
      );
    }
  }, [daysLeft]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (daysLeft === null) {
    return (
      <View style={[styles.badge, styles.mutedBadge]}>
        <Text style={[styles.text, styles.mutedText]}>No deadline</Text>
      </View>
    );
  }

  if (daysLeft < 0) {
    return (
      <View style={[styles.badge, styles.expiredBadge]}>
        <Text style={[styles.text, styles.expiredText]}>Expired</Text>
      </View>
    );
  }

  if (daysLeft <= 1) {
    return (
      <Animated.View style={[styles.badge, styles.roseBadge, pulseStyle]}>
        <Text style={[styles.text, styles.roseText]}>Today!</Text>
      </Animated.View>
    );
  }

  if (daysLeft <= 7) {
    return (
      <View style={[styles.badge, styles.amberBadge]}>
        <Text style={[styles.text, styles.amberText]}>{daysLeft}d left</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.emeraldBadge]}>
      <Text style={[styles.text, styles.emeraldText]}>Safe ✓</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
  roseBadge: { backgroundColor: 'rgba(252,129,129,0.15)' },
  roseText: { color: Colors.accentRose },
  amberBadge: { backgroundColor: 'rgba(246,173,85,0.15)' },
  amberText: { color: Colors.accentAmber },
  emeraldBadge: { backgroundColor: 'rgba(104,211,145,0.15)' },
  emeraldText: { color: Colors.accentEmerald },
  mutedBadge: { backgroundColor: 'rgba(74,85,104,0.15)' },
  mutedText: { color: Colors.textMuted },
  expiredBadge: { backgroundColor: 'rgba(252,129,129,0.1)' },
  expiredText: { color: Colors.accentRose, textDecorationLine: 'line-through' },
});
