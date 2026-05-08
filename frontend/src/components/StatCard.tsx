import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
} from 'react-native-reanimated';
import { GlowCard } from './GlowCard';
import { MonoText } from './MonoText';
import { useCountUp } from '../hooks/useCountUp';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  glowColor?: 'cyan' | 'amber' | 'emerald' | 'purple' | 'rose';
  isCurrency?: boolean;
  animate?: boolean;
}

const AnimatedMonoText = Animated.createAnimatedComponent(
  ({ text, style, ...props }: any) => <MonoText style={style} {...props}>{text}</MonoText>
);

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  glowColor = 'cyan',
  isCurrency = false,
  animate = true,
}) => {
  const { text } = useCountUp(value, 1200, isCurrency);

  return (
    <GlowCard glowColor={glowColor} style={styles.card}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <MonoText
          style={[styles.value, { color }]}
        >
          {isCurrency ? `₹${value.toLocaleString('en-IN')}` : value.toString()}
        </MonoText>
        <Text style={styles.label}>{label}</Text>
      </View>
    </GlowCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  label: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
