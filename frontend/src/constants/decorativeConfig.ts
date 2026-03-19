import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  ChartPie,
  CreditCard,
  DollarSign,
  Landmark,
  Lock,
  Receipt,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";

/** Exclusion zone: percentages 0-100. Icons are rejected if they intersect zone + padding. */
export interface ExclusionZone {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Icon with optional tint. Tints are muted, desaturated. */
export interface IconDef {
  Icon: LucideIcon;
  tint?: string;
}

/** Placed icon with position and style */
export interface PlacedIcon {
  Icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  blur: boolean;
  tint?: string;
}

/** Tint palette — muted, desaturated. Opacity applied separately. Tune for icon colors. */
export const ICON_TINTS: Record<string, string> = {
  money: "#059669",
  bank: "#475569",
  wallet: "#2563eb",
  chart: "#4f46e5",
  security: "#64748b",
  default: "#1a1a1a",
};

export const ICON_POOL: IconDef[] = [
  { Icon: DollarSign, tint: "money" },
  { Icon: Banknote, tint: "money" },
  { Icon: Receipt, tint: "money" },
  { Icon: Wallet, tint: "wallet" },
  { Icon: CreditCard, tint: "wallet" },
  { Icon: Building2, tint: "bank" },
  { Icon: Landmark, tint: "bank" },
  { Icon: ChartPie, tint: "chart" },
  { Icon: TrendingUp, tint: "chart" },
  { Icon: ArrowLeftRight, tint: "chart" },
  { Icon: Lock, tint: "security" },
  { Icon: Shield, tint: "security" },
];

/** Padding around exclusion zones (percentage). Tune: 3-6 for tighter/looser. */
export const EXCLUSION_PADDING_PCT = 4;

/** Base opacity range. Tune: 0.06-0.12 for visibility. */
export const OPACITY_MIN = 0.07;
export const OPACITY_MAX = 0.11;

/** Size range (px). Tune for presence. */
export const SIZE_MIN = 32;
export const SIZE_MAX = 56;

/** Deterministic "random" from seed for stable placement */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/** Check if point (x, y) in 0-100 is inside zone expanded by padding */
function intersectsZone(
  x: number,
  y: number,
  zone: ExclusionZone,
  padding: number
): boolean {
  return (
    x >= zone.left - padding &&
    x <= zone.right + padding &&
    y >= zone.top - padding &&
    y <= zone.bottom + padding
  );
}

/** Check if point is inside any exclusion zone */
function isExcluded(
  x: number,
  y: number,
  zones: ExclusionZone[],
  padding: number
): boolean {
  return zones.some((z) => intersectsZone(x, y, z, padding));
}

/**
 * Generate icon placements with collision avoidance.
 * Uses exclusion zones per page — icons only in allowed gaps.
 */
export function placeIconsWithCollisionAvoidance(
  exclusionZones: ExclusionZone[],
  options: {
    count: number;
    paddingPct?: number;
    seed?: number;
  }
): PlacedIcon[] {
  const { count, paddingPct = EXCLUSION_PADDING_PCT, seed = 0 } = options;
  const placed: PlacedIcon[] = [];
  const gridStep = 8;
  const candidates: Array<{ x: number; y: number }> = [];

  for (let x = 2; x < 98; x += gridStep) {
    for (let y = 4; y < 96; y += gridStep) {
      const jitterX = (seededRandom(seed + x * 7 + y) - 0.5) * 6;
      const jitterY = (seededRandom(seed + x + y * 11) - 0.5) * 6;
      const cx = Math.max(0, Math.min(100, x + jitterX));
      const cy = Math.max(0, Math.min(100, y + jitterY));
      if (!isExcluded(cx, cy, exclusionZones, paddingPct)) {
        candidates.push({ x: cx, y: cy });
      }
    }
  }

  for (let i = 0; i < count && i < candidates.length; i++) {
    const idx = Math.floor(seededRandom(seed + i * 13) * candidates.length);
    const [c] = candidates.splice(idx, 1);
    if (!c) break;
    const def = ICON_POOL[i % ICON_POOL.length];
    const size = SIZE_MIN + seededRandom(seed + i * 17) * (SIZE_MAX - SIZE_MIN);
    const opacity = OPACITY_MIN + seededRandom(seed + i * 19) * (OPACITY_MAX - OPACITY_MIN);
    const rotation = (seededRandom(seed + i * 23) - 0.5) * 16;
    const blur = seededRandom(seed + i * 29) < 0.2;
    const tint = def.tint ? ICON_TINTS[def.tint] : ICON_TINTS.default;

    placed.push({
      Icon: def.Icon,
      x: c.x,
      y: c.y,
      size: Math.round(size),
      opacity,
      rotation,
      blur,
      tint,
    });
  }

  return placed;
}

/** Landing page: hero, how it works, banks. Content ~12-88% horizontal. */
export function buildLandingExclusionZones(): ExclusionZone[] {
  return [
    { top: 0, bottom: 6, left: 0, right: 100 },
    { top: 6, bottom: 42, left: 12, right: 88 },
    { top: 42, bottom: 78, left: 12, right: 88 },
    { top: 78, bottom: 98, left: 12, right: 88 },
  ];
}

/** Upload page: form, dropzone, bank selector. Dense center. */
export function buildUploadExclusionZones(): ExclusionZone[] {
  return [
    { top: 0, bottom: 6, left: 0, right: 100 },
    { top: 6, bottom: 95, left: 20, right: 80 },
  ];
}

/** Demo/analysis page: banner, header, stats, charts, summary, table. */
export function buildDemoExclusionZones(): ExclusionZone[] {
  return [
    { top: 0, bottom: 5, left: 0, right: 100 },
    { top: 5, bottom: 12, left: 0, right: 100 },
    { top: 12, bottom: 95, left: 10, right: 90 },
  ];
}

/** Results page: same as demo. */
export const buildResultsExclusionZones = buildDemoExclusionZones;
