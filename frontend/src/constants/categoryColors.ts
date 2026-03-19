export const CATEGORY_COLORS: Record<string, string> = {
  income: "var(--color-success)",
  dining: "var(--color-cat-dining)",
  groceries: "var(--color-cat-groceries)",
  transport: "var(--color-cat-transport)",
  subscriptions: "var(--color-cat-subscriptions)",
  entertainment: "var(--color-cat-entertainment)",
  shopping: "var(--color-cat-shopping)",
  utilities: "var(--color-cat-utilities)",
  other: "var(--color-cat-other)",
};

export const CATEGORY_HEX: Record<string, string> = {
  income: "#22C55E",
  dining: "#E85D4A",
  groceries: "#2D9B6F",
  transport: "#4A7CF7",
  subscriptions: "#9B59B6",
  entertainment: "#F59E0B",
  shopping: "#EC4899",
  utilities: "#64748B",
  other: "#94A3B8",
};

export function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.other;
}

export function getCategoryHex(slug: string): string {
  return CATEGORY_HEX[slug] ?? CATEGORY_HEX.other;
}
