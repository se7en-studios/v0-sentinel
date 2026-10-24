import { DEMO_PROFILES, type DemoProfile } from "@/lib/admin/i18n-demo";

export const parseProfile = (v: unknown): DemoProfile | null =>
  DEMO_PROFILES.find((p) => p === v) ?? null;

/** Use-case card ids that belong to a profile; investment/partnerships keeps the default order. */
const FIRST_CASE: Partial<Record<DemoProfile, string>> = { forestry: "forestry", farms: "farms", towns: "towns" };

/** Puts the profile's card first and keeps the rest in their original order (new array, input untouched). */
export function orderCases<T extends { id: string }>(cases: readonly T[], profile: DemoProfile | null): T[] {
  const first = profile ? FIRST_CASE[profile] : undefined;
  return [...cases].sort((a, b) => Number(b.id === first) - Number(a.id === first));
}
