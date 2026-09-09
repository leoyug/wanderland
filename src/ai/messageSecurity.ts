export interface AiMessageSenderIdentity {
  id?: string;
  url?: string;
}

export function isTrustedAiMessageSender(sender: AiMessageSenderIdentity, extensionId: string, dashboardUrl: string) {
  if (sender.id !== extensionId || !sender.url) return false;
  try {
    const actual = new URL(sender.url);
    const expected = new URL(dashboardUrl);
    return actual.protocol === expected.protocol
      && actual.host === expected.host
      && actual.pathname === expected.pathname;
  } catch {
    return false;
  }
}
