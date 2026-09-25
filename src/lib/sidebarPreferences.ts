export const SIDEBAR_WIDTH_DEFAULT = 220;
export const SIDEBAR_WIDTH_MIN = 176;
export const SIDEBAR_WIDTH_MAX = 320;
export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_COLLAPSE_THRESHOLD = 160;
export const SIDEBAR_WIDTH_SNAP_THRESHOLD = 20;

const SIDEBAR_PREFERENCES_KEY = "wanderland.sidebar.preferences";

export interface SidebarPreferences {
  width: number;
  collapsed: boolean;
}

export const defaultSidebarPreferences: SidebarPreferences = {
  width: SIDEBAR_WIDTH_DEFAULT,
  collapsed: false,
};

function clampExpandedWidth(width: number) {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)));
}

export function normalizeSidebarWidth(width: number, snapToDefault = false) {
  if (width <= SIDEBAR_COLLAPSE_THRESHOLD) return SIDEBAR_WIDTH_COLLAPSED;
  const clampedWidth = clampExpandedWidth(width);
  return snapToDefault && Math.abs(clampedWidth - SIDEBAR_WIDTH_DEFAULT) <= SIDEBAR_WIDTH_SNAP_THRESHOLD ? SIDEBAR_WIDTH_DEFAULT : clampedWidth;
}

export function normalizeSidebarPreferences(value: Partial<SidebarPreferences> | undefined): SidebarPreferences {
  if (value?.collapsed === true) return { width: SIDEBAR_WIDTH_COLLAPSED, collapsed: true };
  return { width: normalizeSidebarWidth(value?.width ?? SIDEBAR_WIDTH_DEFAULT), collapsed: false };
}

export async function getSidebarPreferences(): Promise<SidebarPreferences> {
  try {
    if (typeof browser !== "undefined") {
      try {
        const stored = await browser.storage.local.get(SIDEBAR_PREFERENCES_KEY);
        return normalizeSidebarPreferences(stored[SIDEBAR_PREFERENCES_KEY] as Partial<SidebarPreferences> | undefined);
      } catch {
        // Fall through to the preview fallback when the browser API is stubbed but unavailable.
      }
    }
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SIDEBAR_PREFERENCES_KEY) : null;
    return normalizeSidebarPreferences(stored ? JSON.parse(stored) as Partial<SidebarPreferences> : undefined);
  } catch {
    return defaultSidebarPreferences;
  }
}

export async function saveSidebarPreferences(preferences: SidebarPreferences): Promise<void> {
  const normalized = normalizeSidebarPreferences(preferences);
  if (typeof browser !== "undefined") {
    try {
      await browser.storage.local.set({ [SIDEBAR_PREFERENCES_KEY]: normalized });
      return;
    } catch {
      // Fall through to the preview fallback when the browser API is stubbed but unavailable.
    }
  }
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(SIDEBAR_PREFERENCES_KEY, JSON.stringify(normalized));
  } catch {
    // The dashboard should remain usable when browser storage is unavailable in a preview.
  }
}
