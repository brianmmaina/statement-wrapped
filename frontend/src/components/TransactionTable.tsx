import { useState, useMemo } from "react";
import { getCategoryHex } from "../constants/categoryColors";
import type { AnalysisTransaction } from "../constants/sampleData";

interface TransactionTableProps {
  transactions: AnalysisTransaction[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d ?? 0}`;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PAGE_SIZE = 15;

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category_slug));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    let out = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((t) => t.merchant.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      out = out.filter((t) => t.category_slug === categoryFilter);
    }
    return out;
  }, [transactions, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search merchant..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontFamily: "DM Sans",
            fontSize: 14,
            minWidth: 200,
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontFamily: "DM Sans",
            fontSize: 14,
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {capitalize(c)}
            </option>
          ))}
        </select>
        <span
          style={{
            fontFamily: "DM Sans",
            fontSize: 14,
            color: "var(--color-text-tertiary)",
          }}
        >
          Showing {filtered.length} of {transactions.length} transactions
        </span>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "DM Sans",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Date
            </th>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Merchant
            </th>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Category
            </th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((t, i) => (
            <tr
              key={t.date + t.merchant + t.amount + i}
              style={{
                borderBottom: "1px solid var(--color-border-subtle)",
                transition: "background 100ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-border-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <td style={{ padding: "12px 16px", color: "var(--color-text-primary)" }}>
                {formatDate(t.date)}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--color-text-primary)" }}>{t.merchant}</td>
              <td style={{ padding: "12px 16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: "DM Sans",
                    fontWeight: 500,
                    backgroundColor: `${getCategoryHex(t.category_slug)}26`,
                    color: getCategoryHex(t.category_slug),
                  }}
                >
                  {capitalize(t.category_slug)}
                </span>
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-primary)" }}>
                {formatAmount(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "8px 16px",
              fontFamily: "DM Sans",
              fontSize: 14,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: "8px 16px",
              fontFamily: "DM Sans",
              fontSize: 14,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
