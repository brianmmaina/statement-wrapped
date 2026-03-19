export interface AnalysisTransaction {
  id?: number | null;
  date: string;
  merchant: string;
  amount: number;
  category_slug: string;
  raw_description?: string | null;
  category_id?: number | null;
}

export interface AnalysisData {
  statement_id: string | number;
  filename: string;
  bank_type: string;
  transaction_count: number;
  spending_by_category: Record<string, number>;
  transactions: AnalysisTransaction[];
  summary?: string;
}

export const SAMPLE_ANALYSIS: AnalysisData = {
  statement_id: "sample",
  filename: "chase_december_2025.csv",
  bank_type: "chase",
  transaction_count: 47,
  spending_by_category: {
    dining: 384.5,
    groceries: 312.8,
    transport: 198.4,
    subscriptions: 87.97,
    entertainment: 143.2,
    shopping: 267.35,
    utilities: 156.0,
    other: 89.45,
  },
  transactions: [
    { date: "2025-12-28", merchant: "Whole Foods Market", amount: 67.43, category_slug: "groceries" },
    { date: "2025-12-27", merchant: "Uber", amount: 14.2, category_slug: "transport" },
    { date: "2025-12-26", merchant: "Netflix", amount: 15.99, category_slug: "subscriptions" },
    { date: "2025-12-25", merchant: "Sweetgreen", amount: 18.5, category_slug: "dining" },
    { date: "2025-12-24", merchant: "Amazon", amount: 89.99, category_slug: "shopping" },
    { date: "2025-12-23", merchant: "Spotify", amount: 9.99, category_slug: "subscriptions" },
    { date: "2025-12-22", merchant: "Trader Joe's", amount: 54.2, category_slug: "groceries" },
    { date: "2025-12-21", merchant: "Lyft", amount: 22.4, category_slug: "transport" },
    { date: "2025-12-20", merchant: "Con Edison", amount: 78.0, category_slug: "utilities" },
    { date: "2025-12-19", merchant: "Chipotle", amount: 14.75, category_slug: "dining" },
    { date: "2025-12-18", merchant: "Apple One", amount: 19.99, category_slug: "subscriptions" },
    { date: "2025-12-17", merchant: "AMC Theatres", amount: 32.5, category_slug: "entertainment" },
    { date: "2025-12-16", merchant: "Target", amount: 124.3, category_slug: "shopping" },
    { date: "2025-12-15", merchant: "Starbucks", amount: 8.75, category_slug: "dining" },
    { date: "2025-12-14", merchant: "MTA", amount: 33.0, category_slug: "transport" },
  ],
  summary: `Your December spending totaled $1,639.67 across 47 transactions. Dining was your largest category at $384.50, roughly 23% of total spend. It was driven primarily by frequent small purchases at Sweetgreen, Chipotle, and Starbucks rather than a single large expense. Groceries came in second at $312.80, which is within a typical range for a single-person household in a major city.

The most actionable finding is your subscription spend: $87.97 across Netflix, Spotify, and Apple One. These are recurring charges that compound monthly. It's worth auditing if any service is underused. Your transport spend of $198.40 reflects consistent Uber and Lyft usage with no single outlier trip.

Shopping at $267.35 is the category with the most variability. Notably, one Amazon purchase of $89.99 accounts for a third of that total. Utilities at $156.00 and entertainment at $143.20 are both stable and within normal ranges.`,
};
