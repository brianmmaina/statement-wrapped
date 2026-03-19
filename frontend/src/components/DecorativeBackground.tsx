import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  placeIconsWithCollisionAvoidance,
  buildLandingExclusionZones,
  buildUploadExclusionZones,
  buildDemoExclusionZones,
  buildResultsExclusionZones,
  EXCLUSION_PADDING_PCT,
} from "../constants/decorativeConfig";

/**
 * Get exclusion zones and icon count for current route.
 * Tune: icon counts per page, exclusion padding.
 */
function usePageConfig(pathname: string, width: number) {
  return useMemo(() => {
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1280;

    let zones;
    let count;
    let padding = EXCLUSION_PADDING_PCT;

    if (pathname === "/") {
      zones = buildLandingExclusionZones();
      count = isMobile ? 6 : isTablet ? 12 : 20;
    } else if (pathname === "/upload") {
      zones = buildUploadExclusionZones();
      count = isMobile ? 4 : isTablet ? 8 : 14;
      padding = isMobile ? 5 : 4;
    } else if (pathname === "/demo" || pathname.startsWith("/analysis/")) {
      zones = pathname === "/demo" ? buildDemoExclusionZones() : buildResultsExclusionZones();
      count = isMobile ? 4 : isTablet ? 10 : 16;
      padding = isMobile ? 5 : 4;
    } else {
      zones = [];
      count = 0;
    }

    return { zones, count, padding };
  }, [pathname, width]);
}

/**
 * Decorative background with layout-aware exclusion zones.
 * Icons placed in gaps between content blocks, never overlapping.
 */
export function DecorativeBackground() {
  const location = useLocation();
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { zones, count, padding } = usePageConfig(location.pathname, width);

  const items = useMemo(() => {
    if (zones.length === 0 || count === 0) return [];
    return placeIconsWithCollisionAvoidance(zones, {
      count,
      paddingPct: padding,
      seed: 42,
    });
  }, [zones, count, padding]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="decorative-background"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden
    >
      {items.map(({ Icon, x, y, size, opacity, rotation, blur, tint }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            opacity,
            transform: `rotate(${rotation}deg)`,
            filter: blur ? "blur(1.5px)" : "none",
            color: tint ?? "var(--color-text-primary)",
          }}
        >
          <Icon size={size} strokeWidth={1.25} style={{ width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}
