import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientCard({ 
  children, 
  colors = ['#FFC0CB', '#E0BBE4', '#B0E0E6'] as const,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 }
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    padding: 20,
  },
});

