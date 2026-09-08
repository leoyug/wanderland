import type { InspirationRepository } from "./repository";

export async function seedDevelopmentData(repository: InspirationRepository, enabled: boolean) {
  if (!import.meta.env.DEV || !enabled) return;
  const { inspirationItems } = await import("@/src/data/demo");
  await repository.seedDemoData(inspirationItems);
}
