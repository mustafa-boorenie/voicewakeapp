import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface WaveformDisplayProps {
  isActive: boolean;
  color?: string;
}

export function WaveformDisplay({ isActive, color = '#4CAF50' }: WaveformDisplayProps) {
  const bars = 40;
  const barWidth = (Dimensions.get('window').width - 60) / bars;

  return (
    <View style={styles.container}>
      <View style={styles.waveform}>
        {Array.from({ length: bars }).map((_, index) => (
          <WaveformBar
            key={index}
            index={index}
            isActive={isActive}
            color={color}
            width={barWidth}
          />
        ))}
      </View>
    </View>
  );
}

function WaveformBar({
  index,
  isActive,
  color,
  width,
}: {
  index: number;
  isActive: boolean;
  color: string;
  width: number;
}) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      const randomHeight = 10 + Math.random() * 40;
      const randomDuration = 300 + Math.random() * 400;
      
      height.value = withRepeat(
        withTiming(randomHeight, {
          duration: randomDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: color,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: width - 2 },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  bar: {
    marginHorizontal: 1,
    borderRadius: 2,
  },
});
