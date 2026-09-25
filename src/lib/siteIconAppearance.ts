/** A conservative decision: only add contrast when a mostly light mark is drawn on transparency. */
export function detectSiteIconBackground(pixels: Uint8ClampedArray): "dark" | undefined {
  const pixelCount = pixels.length / 4;
  if (!pixelCount) return undefined;

  let transparent = 0;
  let visible = 0;
  let light = 0;
  let weightedLuminance = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < 32) transparent += 1;
    if (alpha < 128) continue;
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    visible += 1;
    weightedLuminance += luminance;
    if (luminance > 0.82) light += 1;
  }

  if (transparent / pixelCount < 0.1 || visible / pixelCount < 0.015) return undefined;
  if (weightedLuminance / visible > 0.82 && light / visible > 0.7) return "dark";
  return undefined;
}

function svgPaintLuminance(paint: string): number | undefined {
  const value = paint.toLowerCase();
  if (value === "white") return 1;
  if (value.startsWith("#")) {
    const digits = value.slice(1);
    if (![3, 4, 6, 8].includes(digits.length)) return undefined;
    if (digits.length === 4 && parseInt(digits[3] ?? "0", 16) < 8) return undefined;
    if (digits.length === 8 && parseInt(digits.slice(6), 16) < 128) return undefined;
    const channels = digits.length <= 4
      ? [digits[0], digits[1], digits[2]].map((digit) => parseInt(`${digit}${digit}`, 16))
      : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].map((part) => parseInt(part, 16));
    return (0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0)) / 255;
  }
  if (value.startsWith("rgb(")) {
    const channels = value.slice(4, -1).split(/[\s,]+/).filter(Boolean).slice(0, 3).map((part) => part.endsWith("%") ? parseFloat(part) * 2.55 : parseFloat(part));
    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return undefined;
    return (0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0)) / 255;
  }
  return undefined;
}

/** SVG is not decoded by createImageBitmap in Chrome workers; inspect only unambiguous light paints. */
export function detectSvgSiteIconBackground(svg: string): "dark" | undefined {
  if (!/<svg\b/i.test(svg) || /<(?:rect|image|foreignObject|use)\b/i.test(svg) || /\bbackground(?:-color)?\s*[:=]/i.test(svg)) return undefined;
  const shapeCount = [...svg.matchAll(/<(?:path|circle|ellipse|line|polygon|polyline|text)\b/gi)].length;
  const paintMatches = [...svg.matchAll(/\b(?:fill|stroke)\s*(?:=|:)\s*["']?\s*(#[\da-f]{3,8}|rgba?\([^)]*\)|[a-z]+|url\([^)]*\))/gi)];
  if (!shapeCount || paintMatches.length < shapeCount || !paintMatches.some((match) => /\bfill\s*(?:=|:)/i.test(match[0]))) return undefined;
  const paints = paintMatches
    .map((match) => match[1]?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value) && value !== "none" && value !== "transparent");
  if (!paints.length) return undefined;
  const luminances = paints.map(svgPaintLuminance);
  return luminances.every((luminance) => luminance !== undefined && luminance > 0.82) ? "dark" : undefined;
}
