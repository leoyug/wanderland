import { detectSiteIconBackground, detectSvgSiteIconBackground } from "@/src/lib/siteIconAppearance";

const maxIconBytes = 256_000;

/** Never expands capture permissions: only the already-authorized page origin is read. */
export async function analyzeSiteIcon(iconUrl: string | undefined, pageUrl: string): Promise<{ background?: "dark" } | undefined> {
  if (!iconUrl) return undefined;
  let icon: URL;
  let page: URL;
  try {
    icon = new URL(iconUrl);
    page = new URL(pageUrl);
  } catch {
    return undefined;
  }
  if (!(["http:", "https:"].includes(icon.protocol) && icon.origin === page.origin)) return undefined;

  try {
    const response = await fetch(icon.href, {
      credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > maxIconBytes) return undefined;
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (contentType && !contentType.startsWith("image/")) return undefined;
    const reader = response.body?.getReader();
    if (!reader) return undefined;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxIconBytes) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const blob = new Blob([bytes.buffer], { type: contentType || "image/png" });
    if (contentType === "image/svg+xml") {
      return { background: detectSvgSiteIconBackground(new TextDecoder().decode(bytes)) };
    }
    const bitmap = await createImageBitmap(blob, { resizeWidth: 48, resizeHeight: 48, resizeQuality: "low" });
    try {
      const canvas = new OffscreenCanvas(48, 48);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return undefined;
      context.clearRect(0, 0, 48, 48);
      context.drawImage(bitmap, 0, 0, 48, 48);
      return { background: detectSiteIconBackground(context.getImageData(0, 0, 48, 48).data) };
    } finally {
      bitmap.close();
    }
  } catch {
    // Remote icons often disallow decoding or are on a different host. Capture remains successful.
    return undefined;
  }
}
