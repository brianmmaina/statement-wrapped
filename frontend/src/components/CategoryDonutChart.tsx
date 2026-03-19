import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getCategoryColor, CATEGORY_HEX } from "../constants/categoryColors";

interface ChartItem {
  name: string;
  value: number;
  slug: string;
}

interface CategoryDonutChartProps {
  spendingByCategory: Record<string, number>;
  totalSpend: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

const ALL_CATEGORIES = [
  "dining",
  "groceries",
  "transport",
  "subscriptions",
  "entertainment",
  "shopping",
  "utilities",
  "other",
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CategoryDonutChart({ spendingByCategory, totalSpend }: CategoryDonutChartProps) {
  const data: ChartItem[] = Object.entries(spendingByCategory)
    .filter(([, v]) => v > 0)
    .map(([slug, value]) => ({
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      value,
      slug,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ width: "100%", minHeight: 380 }}>
      <div style={{ width: "100%", height: 320, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={130}
              paddingAngle={1}
              dataKey="value"
              isAnimationActive
              animationDuration={600}
              label={false}
            >
              {data.map((entry) => (
                <Cell key={entry.slug} fill={getCategoryColor(entry.slug)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "DM Serif Display",
              fontSize: 22,
              color: "var(--color-text-primary)",
            }}
          >
            {formatCurrency(totalSpend)}
          </span>
          <span
            style={{
              display: "block",
              fontFamily: "DM Sans",
              fontSize: 10,
              color: "var(--color-text-tertiary)",
              marginTop: 2,
            }}
          >
            Total spending
          </span>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 28px",
          marginTop: 20,
          marginBottom: 0,
        }}
      >
        {ALL_CATEGORIES.map((slug) => (
          <div
            key={slug}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "DM Sans",
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: CATEGORY_HEX[slug] ?? CATEGORY_HEX.other,
                flexShrink: 0,
              }}
            />
            {capitalize(slug)}
          </div>
        ))}
      </div>
    </div>
  );
}
