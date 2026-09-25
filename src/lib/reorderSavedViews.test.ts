import { describe, expect, it } from "vitest";
import { reorderSavedViewIds, savedViewInsertionTarget } from "./reorderSavedViews";

const views = ["system", "a", "b", "c"];

describe("saved view drag preview", () => {
  it("moves down after the crossed row without shifting the system view", () => {
    expect(reorderSavedViewIds(views, "a", "b", true)).toEqual(["system", "b", "a", "c"]);
    expect(savedViewInsertionTarget(["system", "b", "a", "c"], "a")).toBe("c");
  });

  it("moves up before the crossed row", () => {
    expect(reorderSavedViewIds(views, "c", "a", false)).toEqual(["system", "c", "a", "b"]);
    expect(savedViewInsertionTarget(["system", "c", "a", "b"], "c")).toBe("a");
  });

  it("uses an append target for the last row", () => {
    expect(savedViewInsertionTarget(["system", "b", "c", "a"], "a")).toBe("__end__");
  });
});
