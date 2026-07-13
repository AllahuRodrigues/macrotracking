import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type { FoodEntry, BodyMetric } from "@shared/types";

// ── Queries ──────────────────────────────────────────────────────────────────
export const useEntries = (date: string) =>
  useQuery({ queryKey: ["entries", date], queryFn: () => api.getEntries(date) });

export const useDaySummary = (date: string) =>
  useQuery({ queryKey: ["summary", date], queryFn: () => api.getDaySummary(date) });

export const useTrends = (days = 30) =>
  useQuery({ queryKey: ["trends", days], queryFn: () => api.getTrends(days) });

export const useBody = (limit?: number) =>
  useQuery({ queryKey: ["body", limit ?? "all"], queryFn: () => api.getBody(limit) });

export const usePhotos = (category?: string) =>
  useQuery({ queryKey: ["photos", category ?? "all"], queryFn: () => api.getPhotos(category) });

export const useSupplementIntake = (date: string) =>
  useQuery({
    queryKey: ["supp-intake", date],
    queryFn: () => api.getSupplementIntake(date),
  });

export const useWater = (date: string) =>
  useQuery({ queryKey: ["water", date], queryFn: () => api.getWater(date) });

export const useTodaySession = (date: string) =>
  useQuery({ queryKey: ["session", date], queryFn: () => api.getSession(date) });

export const useProgram = () =>
  useQuery({ queryKey: ["program"], queryFn: () => api.getProgram() });

export const useTemplateForDay = (day: number) =>
  useQuery({ queryKey: ["template", day], queryFn: () => api.getTemplateForDay(day) });

export const useHistory = (limit = 30) =>
  useQuery({ queryKey: ["history", limit], queryFn: () => api.getHistory(limit) });

export const useProfile = () =>
  useQuery({ queryKey: ["profile"], queryFn: () => api.getProfile() });

export const useInsights = (days = 60) =>
  useQuery({ queryKey: ["insights", days], queryFn: () => api.getInsights(days), staleTime: 120_000 });

// ── Mutations ────────────────────────────────────────────────────────────────
export function useCreateEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FoodEntry>) => api.createEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries", date] });
      qc.invalidateQueries({ queryKey: ["summary", date] });
    },
  });
}

export function useDeleteEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries", date] });
      qc.invalidateQueries({ queryKey: ["summary", date] });
    },
  });
}

export function useCreateBody() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BodyMetric>) => api.createBody(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body"] }),
  });
}

export function useAddWater(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ml: number) => api.addWater(date, ml),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water", date] }),
  });
}

export function useResetWater(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetWater(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water", date] }),
  });
}

export function useToggleSupplement(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; taken: boolean; quantity?: number }) =>
      api.toggleSupplement(date, v.id, v.taken, v.quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supp-intake", date] }),
  });
}
