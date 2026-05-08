import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Fonts } from '../constants/typography';

interface MonoTextProps {
  children: React.ReactNode;
  style?: TextStyle | (TextStyle | undefined)[] | undefined;
}

export const MonoText: React.FC<MonoTextProps> = ({ children, style }) => {
  return <Text style={[styles.mono, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  mono: {
    fontFamily: Fonts.mono,
  },
});
