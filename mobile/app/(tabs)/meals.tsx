import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { todayISO } from "@shared/timezone";
import { MEAL_TYPES, mealLabel } from "@shared/utils";
import type { FoodEntry, MealType } from "@shared/types";
import { useEntries, useCreateEntry, useDeleteEntry } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { DateNav } from "@/components/DateNav";
import { Card, AppText, ScreenTitle, Button, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

export default function Meals({ embedded = false }: { embedded?: boolean }) {
  const [date, setDate] = useState(todayISO());
  const router = useRouter();
  const { canWrite } = useAuth();
  const entries = useEntries(date);
  const createEntry = useCreateEntry(date);
  const deleteEntry = useDeleteEntry(date);
  const [modal, setModal] = useState(false);

  const list = entries.data ?? [];
  const byMeal = (m: MealType) => list.filter((e) => e.meal_type === m);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={embedded ? [] : ["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={entries.isFetching} onRefresh={() => entries.refetch()} tintColor={theme.colors.accent} />
        }
      >
        <Row style={{ justifyContent: "space-between" }}>
          {!embedded ? <ScreenTitle title="Meals" /> : null}
          {canWrite ? (
            <Row style={{ gap: 4 }}>
              <Pressable
                onPress={() => router.push({ pathname: "/ai-scan", params: { date } })}
                style={{ padding: 8 }}
              >
                <Ionicons name="sparkles" size={26} color={theme.colors.accentWarm} />
              </Pressable>
              <Pressable onPress={() => setModal(true)} style={{ padding: 8 }}>
                <Ionicons name="add-circle" size={30} color={theme.colors.accent} />
              </Pressable>
            </Row>
          ) : null}
        </Row>
        <DateNav date={date} onChange={setDate} />

        {!canWrite ? (
          <Card style={{ marginBottom: 16, borderColor: `${theme.colors.accentWarm}55` }}>
            <AppText size={13} color={theme.colors.accentWarm}>Read-only (Guest). Sign in as Rodrigues to edit.</AppText>
          </Card>
        ) : null}

        {MEAL_TYPES.map((m) => {
          const items = byMeal(m);
          if (!items.length) return null;
          return (
            <View key={m} style={{ marginBottom: 16 }}>
              <AppText muted bold size={12} style={{ textTransform: "uppercase", marginBottom: 8 }}>
                {mealLabel(m)}
              </AppText>
              {items.map((e) => (
                <MealRow key={e.id} entry={e} canWrite={canWrite} onDelete={() => deleteEntry.mutate(e.id)} />
              ))}
            </View>
          );
        })}

        {list.length === 0 ? (
          <Card><AppText muted>No entries logged for this day.</AppText></Card>
        ) : null}
      </ScrollView>

      <AddMealModal
        visible={modal}
        onClose={() => setModal(false)}
        onSubmit={(data) => {
          createEntry.mutate({ ...data, date });
          setModal(false);
        }}
      />
    </SafeAreaView>
  );
}

function MealRow({
  entry,
  canWrite,
  onDelete,
}: {
  entry: FoodEntry;
  canWrite: boolean;
  onDelete: () => void;
}) {
  return (
    <Card style={{ marginBottom: 8, paddingVertical: 12 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText bold size={14}>{entry.name}</AppText>
          <Row style={{ gap: 8, marginTop: 4 }}>
            <Pill label={`${Math.round(entry.calories)} kcal`} color={theme.colors.calories} />
            <AppText muted size={12}>P{Math.round(entry.protein)} · C{Math.round(entry.carbs)} · F{Math.round(entry.fat)}</AppText>
          </Row>
        </View>
        {canWrite ? (
          <Pressable
            onPress={() =>
              Alert.alert("Delete entry?", entry.name, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ])
            }
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.red} />
          </Pressable>
        ) : null}
      </Row>
    </Card>
  );
}

function AddMealModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<FoodEntry>) => void;
}) {
  const [name, setName] = useState("");
  const [meal, setMeal] = useState<MealType>("breakfast");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  const reset = () => {
    setName(""); setCal(""); setP(""); setC(""); setF(""); setMeal("breakfast");
  };

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      meal_type: meal,
      calories: parseFloat(cal) || 0,
      protein: parseFloat(p) || 0,
      carbs: parseFloat(c) || 0,
      fat: parseFloat(f) || 0,
    });
    reset();
  };

  const input = {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.foreground,
    padding: 12,
    fontSize: 15,
  } as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#000a" }}>
        <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <AppText bold size={18}>Add food</AppText>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={theme.colors.muted} /></Pressable>
          </Row>
          <TextInput placeholder="Food name" placeholderTextColor={theme.colors.muted} value={name} onChangeText={setName} style={input} />
          <Row style={{ gap: 8 }}>
            {MEAL_TYPES.map((m) => (
              <Pressable key={m} onPress={() => setMeal(m)} style={{ flex: 1, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: "center", backgroundColor: meal === m ? theme.colors.accent : theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
                <Text style={{ color: meal === m ? "#04140b" : theme.colors.muted, fontSize: 11, fontWeight: "700" }}>{mealLabel(m)}</Text>
              </Pressable>
            ))}
          </Row>
          <TextInput placeholder="Calories" placeholderTextColor={theme.colors.muted} value={cal} onChangeText={setCal} keyboardType="numeric" style={input} />
          <Row style={{ gap: 8 }}>
            <TextInput placeholder="Protein" placeholderTextColor={theme.colors.muted} value={p} onChangeText={setP} keyboardType="numeric" style={[input, { flex: 1 }]} />
            <TextInput placeholder="Carbs" placeholderTextColor={theme.colors.muted} value={c} onChangeText={setC} keyboardType="numeric" style={[input, { flex: 1 }]} />
            <TextInput placeholder="Fat" placeholderTextColor={theme.colors.muted} value={f} onChangeText={setF} keyboardType="numeric" style={[input, { flex: 1 }]} />
          </Row>
          <Button label="Add entry" onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}
