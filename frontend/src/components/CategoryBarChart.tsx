import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { getCategoryColor } from "../constants/categoryColors";

interface ChartItem {
  name: string;
  value: number;
  slug: string;
}

interface CategoryBarChartProps {
  spendingByCategory: Record<string, number>;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function BarLabel({ x, y, width, value }: { x: number; y: number; width: number; value: number }) {
  return (
    <text
      x={x + width + 8}
      y={y + 12}
      textAnchor="start"
      fill="var(--color-text-primary)"
      fontFamily="DM Sans"
      fontSize={13}
    >
      {formatCurrency(value)}
    </text>
  );
}

export function CategoryBarChart({ spendingByCategory }: CategoryBarChartProps) {
  const data: ChartItem[] = Object.entries(spendingByCategory)
    .filter(([, v]) => v > 0)
    .map(([slug, value]) => ({
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      value,
      slug,
    }))
    .sort((a, b) => b.value - a.value);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 96, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide domain={[0, maxVal]} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontFamily: "DM Sans", fontSize: 13, fill: "var(--color-text-primary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="value"
            barSize={24}
            radius={[0, 4, 4, 0]}
            isAnimationActive
            animationDuration={600}
            label={(props: { x?: number; y?: number; width?: number; value?: number }) => (
              <BarLabel
                x={props.x ?? 0}
                y={props.y ?? 0}
                width={props.width ?? 0}
                value={props.value ?? 0}
              />
            )}
          >
            {data.map((entry) => (
              <Cell key={entry.slug} fill={getCategoryColor(entry.slug)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
