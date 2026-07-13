import React, { useEffect, useRef, useState } from "react";
import { Text, Pressable, TextStyle, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

/**
 * Count-up number animation (RAF-driven, ease-out). Great for macro totals.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  style,
  duration = 900,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  style?: TextStyle;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    startRef.current = 0;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {display.toFixed(decimals)}
      {suffix}
    </Text>
  );
}

/**
 * A pressable that springs down on touch, with optional haptic.
 */
export function PressableScale({
  children,
  onPress,
  style,
  haptic = true,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  haptic?: boolean;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        onPress={() => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
