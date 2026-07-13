import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { theme } from "@/lib/theme";
import { AnimatedCounter } from "@/components/anim";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MacroRing({
  value,
  goal,
  label,
  unit = "",
  color = theme.colors.accent,
  size = 120,
  stroke = 10,
  delay = 0,
}: {
  value: number;
  goal: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
  stroke?: number;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const over = goal > 0 && value > goal;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(pct, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
  }, [pct, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  const gradId = `grad-${label.replace(/\s/g, "")}`;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.6" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors.cardBorder}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? theme.colors.accentWarm : `url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AnimatedCounter
        value={value}
        style={{ color: theme.colors.foreground, fontSize: size * 0.2, fontWeight: "800" }}
      />
      <Text style={{ color: theme.colors.muted, fontSize: 11 }}>
        / {Math.round(goal)}
        {unit}
      </Text>
      <Text style={{ color: over ? theme.colors.accentWarm : color, fontSize: 11, fontWeight: "700", marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export function MacroBar({
  value,
  goal,
  label,
  color,
  delay = 0,
}: {
  value: number;
  goal: number;
  label: string;
  color: string;
  delay?: number;
}) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [pct, delay]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${Math.min(100, width.value * 100)}%`,
  }));

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
          {Math.round(value)} / {Math.round(goal)} g
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.cardBorder, overflow: "hidden" }}>
        <Animated.View style={[{ height: "100%", backgroundColor: color, borderRadius: 4 }, animatedWidth]} />
      </View>
    </View>
  );
}
