import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/AuthContext";
import { RODRIGUES_CODE } from "@shared/access";
import { Button, AppText } from "@/components/ui";
import { theme } from "@/lib/theme";

export default function Gate() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"choose" | "code">("choose");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function enterAsGuest() {
    await signIn("guest");
    router.replace("/(tabs)");
  }

  async function submitCode() {
    if (code.trim() !== RODRIGUES_CODE) {
      setError("Invalid access code");
      return;
    }
    await signIn("rodrigues", code.trim());
    router.replace("/(tabs)");
  }

  return (
    <LinearGradient colors={["#0b0f0e", "#111a16", "#0b0f0e"]} style={styles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.center}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>MacroTrack</Text>
          <AppText muted size={14}>Cut · Train · Track — to Aug 14</AppText>
        </View>

        {mode === "choose" ? (
          <View style={{ width: "100%", gap: 12 }}>
            <Button label="Sign in as Rodrigues" onPress={() => setMode("code")} />
            <Button label="Continue as Guest (read-only)" variant="ghost" onPress={enterAsGuest} />
          </View>
        ) : (
          <View style={{ width: "100%", gap: 12 }}>
            <TextInput
              value={code}
              onChangeText={(t) => {
                setCode(t);
                setError("");
              }}
              placeholder="Access code"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              keyboardType="number-pad"
              style={styles.input}
              autoFocus
            />
            {error ? <Text style={{ color: theme.colors.red, fontSize: 13 }}>{error}</Text> : null}
            <Button label="Enter" onPress={submitCode} />
            <Button label="Back" variant="ghost" onPress={() => setMode("choose")} />
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logo: { color: theme.colors.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  input: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.foreground,
    fontSize: 18,
    padding: 16,
    textAlign: "center",
    letterSpacing: 4,
  },
});
