import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAppLanguage, getAppLanguage, resolveAppLanguage, setAppLanguage } from "./language";

afterEach(() => vi.unstubAllGlobals());

describe("app language", () => {
  it("defaults to Simplified Chinese and persists a supported future selection", async () => {
    const values: Record<string, unknown> = {};
    vi.stubGlobal("browser", { storage: { local: {
      async get(key: string) { return key in values ? { [key]: values[key] } : {}; },
      async set(next: Record<string, unknown>) { Object.assign(values, next); },
    } } });

    await expect(getAppLanguage()).resolves.toBe(defaultAppLanguage);
    await setAppLanguage("en-US");
    await expect(getAppLanguage()).resolves.toBe("en-US");
  });

  it("ignores unsupported stored values", async () => {
    vi.stubGlobal("browser", { storage: { local: {
      async get() { return { "wanderland.interface.language": "unsupported" }; },
      async set() {},
    } } });

    await expect(getAppLanguage()).resolves.toBe("zh-CN");
  });

  it("resolves system preference from the browser language", () => {
    expect(resolveAppLanguage("system", "zh-HK")).toBe("zh-CN");
    expect(resolveAppLanguage("system", "en-GB")).toBe("en-US");
    expect(resolveAppLanguage("zh-CN", "en-GB")).toBe("zh-CN");
  });
});
