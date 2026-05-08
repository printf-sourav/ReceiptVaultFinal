import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';
import { formatIndianCurrency } from '../lib/mockData';

export const useCountUp = (
  target: number,
  duration: number = 1200,
  isCurrency: boolean = true
) => {
  const current = useSharedValue(0);

  useEffect(() => {
    current.value = 0;
    current.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, duration]);

  const text = useDerivedValue(() => {
    const val = Math.round(current.value);
    if (isCurrency) {
      return formatIndianCurrency(val);
    }
    return val.toString();
  });

  return { current, text };
};
