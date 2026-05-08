import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Circle, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface VaultLogoProps {
  size?: number;
  animated?: boolean;
}

export const VaultLogo: React.FC<VaultLogoProps> = ({ size = 80, animated = true }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={animated ? animatedStyle : undefined}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <SvgGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#63B3ED" />
              <Stop offset="1" stopColor="#B794F4" />
            </SvgGradient>
          </Defs>
          <Polygon
            points={points}
            fill="none"
            stroke="url(#hexGrad)"
            strokeWidth={2.5}
          />
          <Circle cx={cx} cy={cy - size * 0.06} r={size * 0.09} fill="url(#hexGrad)" />
          <Rect
            x={cx - size * 0.035}
            y={cy - size * 0.02}
            width={size * 0.07}
            height={size * 0.16}
            rx={size * 0.02}
            fill="url(#hexGrad)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
