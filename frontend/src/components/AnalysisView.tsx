import { motion } from "framer-motion";
import { AISummary } from "./AISummary";
import { CategoryBarChart } from "./CategoryBarChart";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { StatTile } from "./StatTile";
import { TransactionTable } from "./TransactionTable";
import type { AnalysisData } from "../constants/sampleData";

interface AnalysisViewProps {
  analysis: AnalysisData;
  isSample?: boolean;
  isDemo?: boolean;
  onUploadAnother?: () => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => capitalize(w))
    .join(" ");
}

export function AnalysisView({ analysis, isSample, isDemo, onUploadAnother }: AnalysisViewProps) {
  const values = Object.values(analysis.spending_by_category);
  const spending = values.filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const income = values.filter((v) => v < 0).reduce((a, b) => a + Math.abs(b), 0);
  const net = income - spending;
  const topCategory = Object.entries(analysis.spending_by_category)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategory ? capitalize(topCategory[0]) : "—";

  return (
    <div style={{ paddingTop: 24 }}>
      {isSample && (
        <div
          style={{
            padding: "16px 20px",
            marginBottom: 24,
            background: "var(--color-accent-subtle)",
            borderLeft: "4px solid var(--color-accent)",
            borderRadius: "0 6px 6px 0",
            fontFamily: "DM Sans",
            fontSize: 14,
            color: "var(--color-text-primary)",
          }}
        >
          This is a sample analysis using fictional data. Upload your own statement to see your real spending breakdown.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "DM Serif Display",
              fontSize: 24,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            {analysis.filename}
          </h2>
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 8px",
              borderRadius: 4,
              fontFamily: "DM Sans",
              fontSize: 12,
              fontWeight: 500,
              background: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {capitalize(analysis.bank_type.replace("_", " "))}
          </span>
        </div>
        {onUploadAnother && (
          <a
            href="/upload"
            onClick={(e) => {
              e.preventDefault();
              onUploadAnother();
            }}
            style={{
              fontFamily: "DM Sans",
              fontSize: 13,
              color: "var(--color-accent)",
              textDecoration: "none",
              alignSelf: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Upload another statement
          </a>
        )}
      </div>

      <div
        style={{
          fontFamily: "DM Sans",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "var(--color-text-tertiary)",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Overview
      </div>
      <motion.div
        className="stat-tiles"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "flex",
          gap: 40,
          marginBottom: 48,
          flexWrap: "wrap",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatTile label="Spending" value={formatCurrency(spending)} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <StatTile label="Income" value={formatCurrency(income)} variant="success" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <StatTile
            label="Net Income"
            value={formatCurrency(net)}
            variant={net >= 0 ? "success" : "danger"}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <StatTile label="Transactions" value={analysis.transaction_count} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <StatTile label="Top Category" value={topCategoryName} />
        </motion.div>
      </motion.div>

      {income > 0 && (() => {
        const incomeTxns = analysis.transactions.filter((t) => t.amount < 0);
        const bySource = incomeTxns.reduce<Record<string, number>>((acc, t) => {
          const name = t.raw_description || t.merchant || "Other";
          acc[name] = (acc[name] || 0) + Math.abs(t.amount);
          return acc;
        }, {});
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              marginBottom: 32,
              padding: "16px 20px",
              background: "var(--color-surface)",
              borderRadius: 8,
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "var(--color-text-primary)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Income breakdown
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}>
              {Object.entries(bySource).map(([source, amount]) => (
                <div
                  key={source}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "DM Sans",
                    fontSize: 14,
                    color: "var(--color-text-primary)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--color-success)",
                    }}
                  />
                  {toTitleCase(source)}: {formatCurrency(amount)}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {analysis.summary && analysis.summary.trim().length > 0 && (
        <AISummary summary={analysis.summary} />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60fr 40fr",
          gap: 32,
          marginBottom: 40,
        }}
        className="charts-grid"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{
            padding: isDemo ? 0 : 24,
            borderRadius: 8,
            border: "1px solid var(--color-border-subtle)",
            overflow: "hidden",
          }}
        >
          {isDemo && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                height: 32,
                paddingRight: 20,
                paddingTop: 12,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "DM Sans",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                Demo
              </span>
            </div>
          )}
          <div style={{ padding: isDemo ? "0 24px 24px 24px" : 0 }}>
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Spending by category
            </div>
            <CategoryBarChart spendingByCategory={analysis.spending_by_category} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={{
            padding: isDemo ? 0 : 24,
            borderRadius: 8,
            border: "1px solid var(--color-border-subtle)",
            minHeight: isDemo ? 460 : 420,
            overflow: "hidden",
          }}
        >
          {isDemo && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                height: 32,
                paddingRight: 20,
                paddingTop: 12,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "DM Sans",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                Demo
              </span>
            </div>
          )}
          <div style={{ padding: isDemo ? "0 24px 24px 24px" : 0 }}>
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Spending breakdown
            </div>
            <CategoryDonutChart spendingByCategory={analysis.spending_by_category} totalSpend={spending} />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          padding: 24,
          borderRadius: 8,
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <div
          style={{
            fontFamily: "DM Sans",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--color-text-tertiary)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          All transactions
        </div>
        <TransactionTable transactions={analysis.transactions} />
      </motion.div>
    </div>
  );
}
