import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

const GLOW_COLORS = {
  cyan: {
    subtle: Colors.borderSubtle,
    glow: Colors.borderGlow,
    active: Colors.borderActive,
  },
  amber: {
    subtle: 'rgba(246, 173, 85, 0.08)',
    glow: 'rgba(246, 173, 85, 0.28)',
    active: 'rgba(246, 173, 85, 0.55)',
  },
  emerald: {
    subtle: 'rgba(104, 211, 145, 0.08)',
    glow: 'rgba(104, 211, 145, 0.28)',
    active: 'rgba(104, 211, 145, 0.55)',
  },
  purple: {
    subtle: 'rgba(183, 148, 244, 0.08)',
    glow: 'rgba(183, 148, 244, 0.28)',
    active: 'rgba(183, 148, 244, 0.55)',
  },
  rose: {
    subtle: 'rgba(252, 129, 129, 0.08)',
    glow: 'rgba(252, 129, 129, 0.28)',
    active: 'rgba(252, 129, 129, 0.55)',
  },
};

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: keyof typeof GLOW_COLORS;
  intensity?: 'subtle' | 'medium' | 'high';
  onPress?: () => void;
  style?: ViewStyle;
  pulse?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor = 'cyan',
  intensity = 'subtle',
  onPress,
  style,
  pulse = false,
}) => {
  const borderProgress = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const pressed = useSharedValue(0);

  const colors = GLOW_COLORS[glowColor];

  useEffect(() => {
    borderProgress.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      pressed.value === 1 ? 1 : borderProgress.value,
      [0, 0.5, 1],
      pressed.value === 1
        ? [colors.active, colors.active, colors.active]
        : [colors.subtle, colors.glow, colors.subtle]
    );
    return {
      borderColor,
      transform: [{ scale: scaleValue.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = 1;
    scaleValue.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = 0;
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = (
    <Animated.View style={[styles.card, animatedBorderStyle, style]}>
      <LinearGradient
        colors={[Colors.bgSecondary, Colors.bgTertiary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
