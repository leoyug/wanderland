import { buildDigest, digestId, digestPeriod, type ContentDigest, type DigestKind } from "@/src/domain/digest";
import { db, type WanderlandDatabase } from "./database";
import { InspirationRepository } from "./repository";

export class DigestRepository {
  constructor(private readonly database: WanderlandDatabase = db) {}
  list(kind: DigestKind) { return this.database.digests.where("kind").equals(kind).reverse().sortBy("periodStart"); }
  get(id: string) { return this.database.digests.get(id); }
  async markRead(id: string) {
    await this.database.transaction("rw", this.database.digests, async () => {
      const digest = await this.database.digests.get(id);
      if (digest && !digest.readAt) await this.database.digests.update(id, { readAt: Date.now() });
    });
  }
  async generate(kind: DigestKind, timestamp = Date.now()): Promise<ContentDigest> {
    const { start } = digestPeriod(kind, timestamp);
    const id = digestId(kind, start);
    const existing = await this.get(id);
    if (existing) return existing;
    const items = await new InspirationRepository(this.database).listLibraryItems();
    const digest = buildDigest(kind, start, items);
    // An atomic snapshot is the only persisted outcome. Interrupted local generation can be retried.
    return this.database.transaction("rw", this.database.digests, async () => {
      const saved = await this.get(id);
      if (saved) return saved;
      await this.database.digests.add(digest);
      return digest;
    });
  }
  async ensureWeeklyDigests(now = Date.now()) {
    const currentWeek = digestPeriod("weekly", now).start;
    const items = (await new InspirationRepository(this.database).listLibraryItems()).filter((item) => !item.archivedAt);
    const completedStarts = new Set(items.filter((item) => item.createdAt < currentWeek).map((item) => digestPeriod("weekly", item.createdAt).start));
    if (completedStarts.size) completedStarts.add(digestPeriod("weekly", currentWeek - 1).start);
    const existing = new Set((await this.list("weekly")).map((digest) => digest.id));
    for (const start of [...completedStarts].sort((a, b) => b - a)) {
      if (existing.has(digestId("weekly", start))) continue;
      const digest = buildDigest("weekly", start, items, now);
      await this.database.transaction("rw", this.database.digests, async () => {
        if (!await this.get(digest.id)) await this.database.digests.add(digest);
      });
    }
  }
}
export const digestRepository = new DigestRepository();
