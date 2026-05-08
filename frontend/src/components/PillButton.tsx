import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Fonts, FontSizes } from '../constants/typography';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'whatsapp';
  loading?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  style,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getGradientColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return Colors.gradientCyan;
      case 'whatsapp':
        return ['#25D366', '#128C7E'] as const;
      case 'danger':
        return [Colors.accentRose, '#E53E3E'] as const;
      default:
        return [Colors.bgTertiary, Colors.bgElevated] as const;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'whatsapp':
        return '#080B14';
      case 'danger':
        return '#FFFFFF';
      default:
        return Colors.textPrimary;
    }
  };

  const borderStyle: ViewStyle =
    variant === 'secondary'
      ? { borderWidth: 1, borderColor: Colors.borderGlow }
      : {};

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View style={[animatedStyle, style]}>
        <LinearGradient
          colors={getGradientColors() as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, borderStyle]}
        >
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <Text style={[styles.label, { color: getTextColor() }]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    letterSpacing: -0.3,
  },
});
