import type { InspirationRepository } from "./repository";

export async function seedDevelopmentData(repository: InspirationRepository) {
  if (!import.meta.env.DEV || new URLSearchParams(window.location.search).get("seed") !== "demo") return;
  const { inspirationItems } = await import("@/src/data/demo");
  await repository.seedDemoData(inspirationItems);
}
