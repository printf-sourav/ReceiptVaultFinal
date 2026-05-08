import React from 'react';
import { ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '../constants/colors';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 1200,
        loop: true,
      }}
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.bgTertiary,
        },
        style,
      ]}
    />
  );
};
