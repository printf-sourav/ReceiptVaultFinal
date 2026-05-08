import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ScanLine: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const translateY = useSharedValue(-2);

  useEffect(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 800,
    });

    const timeout = setTimeout(() => {
      setVisible(false);
    }, 900);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.scanLine, animatedStyle]} pointerEvents="none" />
  );
};

const styles = StyleSheet.create({
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.accentCyan,
    opacity: 0.6,
    zIndex: 9999,
  },
});
