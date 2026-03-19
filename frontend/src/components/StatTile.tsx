interface StatTileProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "danger";
  description?: string;
}

export function StatTile({ label, value, variant = "default", description }: StatTileProps) {
  const color =
    variant === "success"
      ? "var(--color-success)"
      : variant === "danger"
        ? "var(--color-error)"
        : "var(--color-text-primary)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span
        style={{
          fontFamily: "DM Serif Display",
          fontSize: "28px",
          color,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "DM Sans",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--color-text-primary)",
        }}
      >
        {label}
      </span>
      {description && (
        <span
          style={{
            fontFamily: "DM Sans",
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
            lineHeight: 1.3,
            maxWidth: 140,
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
}
