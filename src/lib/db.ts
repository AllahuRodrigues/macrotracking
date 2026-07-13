import * as sqlite from "./db-sqlite";
import * as supabase from "./db-supabase";
import { useSupabase } from "./supabase-client";

const remote = () => useSupabase();

export function getUploadsDir() {
  return sqlite.getUploadsDir();
}

export async function getFoodEntries(date?: string) {
  return remote() ? supabase.getFoodEntries(date) : sqlite.getFoodEntries(date);
}
export async function createFoodEntry(data: Parameters<typeof sqlite.createFoodEntry>[0]) {
  return remote() ? supabase.createFoodEntry(data) : sqlite.createFoodEntry(data);
}
export async function updateFoodEntry(id: string, data: Parameters<typeof sqlite.updateFoodEntry>[1]) {
  return remote() ? supabase.updateFoodEntry(id, data) : sqlite.updateFoodEntry(id, data);
}
export async function deleteFoodEntry(id: string) {
  return remote() ? supabase.deleteFoodEntry(id) : sqlite.deleteFoodEntry(id);
}

export async function getBodyMetrics(limit?: number) {
  return remote() ? supabase.getBodyMetrics(limit) : sqlite.getBodyMetrics(limit);
}
export async function getBodyMetricByDate(date: string) {
  return remote() ? supabase.getBodyMetricByDate(date) : sqlite.getBodyMetricByDate(date);
}
export async function createBodyMetric(data: Parameters<typeof sqlite.createBodyMetric>[0]) {
  return remote() ? supabase.createBodyMetric(data) : sqlite.createBodyMetric(data);
}
export async function updateBodyMetric(id: string, data: Parameters<typeof sqlite.updateBodyMetric>[1]) {
  return remote() ? supabase.updateBodyMetric(id, data) : sqlite.updateBodyMetric(id, data);
}
export async function deleteBodyMetric(id: string) {
  return remote() ? supabase.deleteBodyMetric(id) : sqlite.deleteBodyMetric(id);
}

export async function getPhotos(category?: string) {
  return remote() ? supabase.getPhotos(category) : sqlite.getPhotos(category);
}
export async function createPhoto(data: Parameters<typeof sqlite.createPhoto>[0]) {
  return remote() ? supabase.createPhoto(data) : sqlite.createPhoto(data);
}
export async function deletePhoto(id: string) {
  return remote() ? supabase.deletePhoto(id) : sqlite.deletePhoto(id);
}

export async function getDailyMacroSummaries(days = 30) {
  return remote() ? supabase.getDailyMacroSummaries(days) : sqlite.getDailyMacroSummaries(days);
}
export async function getMacroSummaryForDate(date: string) {
  return remote() ? supabase.getMacroSummaryForDate(date) : sqlite.getMacroSummaryForDate(date);
}

export async function getWorkoutTemplates() {
  return remote() ? supabase.getWorkoutTemplates() : sqlite.getWorkoutTemplates();
}
export async function getTemplateForDay(weekDay: number) {
  return remote() ? supabase.getTemplateForDay(weekDay) : sqlite.getTemplateForDay(weekDay);
}
export async function getTemplateExercises(templateId: string) {
  return remote() ? supabase.getTemplateExercises(templateId) : sqlite.getTemplateExercises(templateId);
}

export async function getWorkoutSessions(limit = 30) {
  return remote() ? supabase.getWorkoutSessions(limit) : sqlite.getWorkoutSessions(limit);
}
export async function getSessionForDate(date: string) {
  return remote() ? supabase.getSessionForDate(date) : sqlite.getSessionForDate(date);
}
export async function createWorkoutSession(data: Parameters<typeof sqlite.createWorkoutSession>[0]) {
  return remote() ? supabase.createWorkoutSession(data) : sqlite.createWorkoutSession(data);
}
export async function updateWorkoutSession(id: string, data: Parameters<typeof sqlite.updateWorkoutSession>[1]) {
  return remote() ? supabase.updateWorkoutSession(id, data) : sqlite.updateWorkoutSession(id, data);
}
export async function deleteWorkoutSession(id: string) {
  return remote() ? supabase.deleteWorkoutSession(id) : sqlite.deleteWorkoutSession(id);
}

export async function getSessionExercises(sessionId: string) {
  return remote() ? supabase.getSessionExercises(sessionId) : sqlite.getSessionExercises(sessionId);
}
export async function upsertSessionExercise(data: Parameters<typeof sqlite.upsertSessionExercise>[0]) {
  return remote() ? supabase.upsertSessionExercise(data) : sqlite.upsertSessionExercise(data);
}

export async function getWaterLogForDate(date: string) {
  return remote() ? supabase.getWaterLogForDate(date) : sqlite.getWaterLogForDate(date);
}
export async function getTotalWaterForDate(date: string) {
  return remote() ? supabase.getTotalWaterForDate(date) : sqlite.getTotalWaterForDate(date);
}
export async function addWaterLog(date: string, amount_ml: number) {
  return remote() ? supabase.addWaterLog(date, amount_ml) : sqlite.addWaterLog(date, amount_ml);
}
export async function deleteWaterLog(id: string) {
  return remote() ? supabase.deleteWaterLog(id) : sqlite.deleteWaterLog(id);
}
export async function resetWaterForDate(date: string) {
  return remote() ? supabase.resetWaterForDate(date) : sqlite.resetWaterForDate(date);
}

export async function getDailyCheckin(date: string) {
  return remote() ? supabase.getDailyCheckin(date) : sqlite.getDailyCheckin(date);
}
export async function getDailyCheckins(days = 30) {
  return remote() ? supabase.getDailyCheckins(days) : sqlite.getDailyCheckins(days);
}
export async function upsertDailyCheckin(data: Parameters<typeof sqlite.upsertDailyCheckin>[0]) {
  return remote() ? supabase.upsertDailyCheckin(data) : sqlite.upsertDailyCheckin(data);
}

export async function getSupplements(activeOnly = false) {
  return remote() ? supabase.getSupplements(activeOnly) : sqlite.getSupplements(activeOnly);
}
export async function createSupplement(data: Parameters<typeof sqlite.createSupplement>[0]) {
  return remote() ? supabase.createSupplement(data) : sqlite.createSupplement(data);
}
export async function updateSupplement(id: string, data: Parameters<typeof sqlite.updateSupplement>[1]) {
  return remote() ? supabase.updateSupplement(id, data) : sqlite.updateSupplement(id, data);
}
export async function deleteSupplement(id: string) {
  return remote() ? supabase.deleteSupplement(id) : sqlite.deleteSupplement(id);
}

export async function getSupplementIntakesForDate(date: string) {
  return remote() ? supabase.getSupplementIntakesForDate(date) : sqlite.getSupplementIntakesForDate(date);
}
export async function toggleSupplementIntake(date: string, supplementId: string, taken: boolean, quantity = 1) {
  return remote()
    ? supabase.toggleSupplementIntake(date, supplementId, taken, quantity)
    : sqlite.toggleSupplementIntake(date, supplementId, taken, quantity);
}
export async function setSupplementQuantity(date: string, supplementId: string, quantity: number) {
  return remote()
    ? supabase.setSupplementQuantity(date, supplementId, quantity)
    : sqlite.setSupplementQuantity(date, supplementId, quantity);
}
export async function markAllSupplementsForDate(date: string, supplementIds: string[]) {
  return remote()
    ? supabase.markAllSupplementsForDate(date, supplementIds)
    : sqlite.markAllSupplementsForDate(date, supplementIds);
}
export async function getSupplementIntakeHistory(days = 14) {
  return remote() ? supabase.getSupplementIntakeHistory(days) : sqlite.getSupplementIntakeHistory(days);
}

export async function getUserProfile() {
  return remote() ? supabase.getUserProfile() : sqlite.getUserProfile();
}
export async function upsertUserProfile(data: Parameters<typeof sqlite.upsertUserProfile>[0]) {
  return remote() ? supabase.upsertUserProfile(data) : sqlite.upsertUserProfile(data);
}

export { useSupabase };
