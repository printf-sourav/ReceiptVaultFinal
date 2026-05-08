import { Platform } from 'react-native';

export const Fonts = {
  heading: 'SpaceGrotesk_700Bold',
  bodyRegular: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  hero: 48,
};

export const LetterSpacing = {
  heading: -0.5,
  wide: 1.5,
};
