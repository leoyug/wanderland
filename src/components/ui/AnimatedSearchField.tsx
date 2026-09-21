import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/cn";
import { SearchField, SearchInput } from "./SearchField";

interface AnimatedSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

function readNumber(name: string, fallback: number) {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function cubicBezier(value: string) {
  const match = value.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
  if (!match) return (t: number) => t;
  const [x1, y1, x2, y2] = match.slice(1).map(Number) as [number, number, number, number];
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (t: number) => {
    if (t <= 0 || t >= 1) return t;
    let s = t;
    for (let index = 0; index < 8; index += 1) {
      const dx = ((ax * s + bx) * s + cx) * s - t;
      const derivative = (3 * ax * s + 2 * bx) * s + cx;
      if (Math.abs(dx) < 1e-6 || derivative === 0) break;
      s -= dx / derivative;
    }
    return ((ay * s + by) * s + cy) * s;
  };
}

function buildGlow(text: string, input: HTMLInputElement, width: number) {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return "";
  context.font = getComputedStyle(input).font;
  const spread = readNumber("--glow-spread", 1.5);
  const paddingLeft = parseFloat(getComputedStyle(input).paddingLeft) || 0;
  const layers: string[] = [];
  let x = 0;
  text.split(/(\s+)/).forEach((segment) => {
    const segmentWidth = context.measureText(segment).width;
    if (segment.trim()) {
      const center = paddingLeft + x + segmentWidth / 2;
      const halfWidth = Math.max(segmentWidth * 0.45, 8) * spread;
      const glowLayers: Array<[number, number, number, number]> = [[0, 0.8, 7, 0.16], [halfWidth * 0.45, 0.55, 8, 0.12], [-halfWidth * 0.4, 0.65, 6, 0.1], [halfWidth * 0.15, 0.9, 5, 0.08]];
      glowLayers.forEach(([offset, widthRatio, height, opacity]) => {
        const left = (((center + offset) / Math.max(width, 1)) * 100).toFixed(2);
        layers.push(`radial-gradient(ellipse ${Math.max(halfWidth * widthRatio, 2).toFixed(1)}px ${height}px at ${left}% 100%, rgba(46,46,46,${opacity}), transparent)`);
      });
    }
    x += segmentWidth;
  });
  return layers.join(", ");
}

export function AnimatedSearchField({ value, onChange, placeholder, className, inputRef: externalInputRef, "aria-label": ariaLabel }: AnimatedSearchFieldProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? localInputRef;
  const mirrorRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const [clearingText, setClearingText] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const clear = () => {
    if (!value || isClearing) return;
    const input = inputRef.current;
    const keepFocus = document.activeElement === input;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !input || !mirrorRef.current || !placeholderRef.current || !glowRef.current) {
      onChange("");
      if (keepFocus) requestAnimationFrame(() => input?.focus({ preventScroll: true }));
      return;
    }

    const text = value.replace(/ /g, "\u00a0");
    setClearingText(text);
    setIsClearing(true);
    onChange("");

    const total = readNumber("--clear-dur", 450);
    const outDuration = readNumber("--clear-out-dur", 220);
    const inDuration = readNumber("--clear-in-dur", 220);
    const outFly = readNumber("--clear-out-fly", 8);
    const inFly = readNumber("--clear-in-fly", 8);
    const blur = readNumber("--clear-blur", 2);
    const glowDelay = readNumber("--glow-delay", 30);
    const peakAt = readNumber("--glow-peak-at", 0.2);
    const glowOpacity = readNumber("--glow-opacity", 0.22);
    const root = document.documentElement;
    const easeOut = cubicBezier(getComputedStyle(root).getPropertyValue("--clear-out-ease"));
    const easeIn = cubicBezier(getComputedStyle(root).getPropertyValue("--clear-in-ease"));
    const glow = glowRef.current;
    const mirror = mirrorRef.current;
    const fakePlaceholder = placeholderRef.current;
    glow.style.background = buildGlow(text, input, glow.parentElement?.clientWidth ?? 280);
    glow.style.opacity = "0";
    fakePlaceholder.style.transform = `translateY(-${inFly}px)`;
    fakePlaceholder.style.opacity = "0.9";
    fakePlaceholder.style.filter = `blur(${blur}px)`;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const outgoing = easeOut(Math.min(1, elapsed / outDuration));
      mirror.style.transform = `translateY(${(outgoing * outFly).toFixed(1)}px)`;
      mirror.style.opacity = (1 - outgoing).toFixed(3);
      mirror.style.filter = `blur(${(outgoing * blur).toFixed(1)}px)`;
      const incoming = easeIn(Math.min(1, elapsed / inDuration));
      fakePlaceholder.style.transform = `translateY(${(-inFly + incoming * inFly).toFixed(1)}px)`;
      fakePlaceholder.style.opacity = (0.9 + incoming * 0.1).toFixed(3);
      fakePlaceholder.style.filter = `blur(${(blur - incoming * blur).toFixed(1)}px)`;
      let glowProgress = 0;
      if (elapsed > glowDelay) {
        const progress = Math.min(1, (elapsed - glowDelay) / Math.max(1, total - glowDelay));
        glowProgress = progress < peakAt ? progress / peakAt : 1 - (progress - peakAt) / (1 - peakAt);
      }
      glow.style.opacity = (glowProgress * glowOpacity).toFixed(3);
      if (elapsed < total) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      frameRef.current = undefined;
      mirror.style.cssText = "";
      fakePlaceholder.style.cssText = "";
      glow.style.opacity = "0";
      glow.style.background = "";
      setClearingText("");
      setIsClearing(false);
      if (keepFocus) requestAnimationFrame(() => input.focus({ preventScroll: true }));
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  return (
    <SearchField className={cn("library-search", className)} value={value} onChange={onChange} aria-label={ariaLabel}>
      <RiSearchLine size={20} aria-hidden="true" />
      <div className={cn("library-search-input-wrap", "t-clear", value && "has-value", isClearing && "is-clearing")}>
        <SearchInput ref={inputRef} placeholder={placeholder} />
        <div ref={mirrorRef} className="t-clear-mirror" aria-hidden="true">{isClearing ? clearingText : value.replace(/ /g, "\u00a0")}</div>
        <div ref={placeholderRef} className="t-clear-placeholder" aria-hidden="true">{placeholder}</div>
        <div ref={glowRef} className="t-clear-glow" aria-hidden="true" />
      </div>
      {value || isClearing ? <Button className="t-clear-btn" variant="ghost" size="icon" aria-label="清除搜索" onPress={clear}><RiCloseLine size={15} /></Button> : <span className="shortcut"><span aria-hidden="true">⌘</span> K</span>}
    </SearchField>
  );
}
