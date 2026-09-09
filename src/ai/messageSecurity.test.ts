import { describe, expect, it } from "vitest";
import { isTrustedAiMessageSender } from "./messageSecurity";

describe("AI message sender validation", () => {
  const dashboard = "chrome-extension://extension-id/dashboard.html";

  it("accepts only the extension's Dashboard page", () => {
    expect(isTrustedAiMessageSender({ id: "extension-id", url: `${dashboard}?item=1` }, "extension-id", dashboard)).toBe(true);
    expect(isTrustedAiMessageSender({ id: "extension-id", url: "https://example.com/" }, "extension-id", dashboard)).toBe(false);
    expect(isTrustedAiMessageSender({ id: "other-extension", url: dashboard }, "extension-id", dashboard)).toBe(false);
    expect(isTrustedAiMessageSender({ id: "extension-id", url: "chrome-extension://extension-id/options.html" }, "extension-id", dashboard)).toBe(false);
  });
});
