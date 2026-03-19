/** How It Works step data. Swap image paths here to update screenshots. */
export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Export your CSV",
    body: "Download your transaction history directly from your bank. No login or bank connection required.",
    image: "/exportcsv.png",
  },
  {
    step: 2,
    title: "Upload and analyze",
    body: "Drop in your CSV, choose your bank, and let StatementWrapped clean and categorize every transaction.",
    image: "/uploadcsvscreenshot.png",
  },
  {
    step: 3,
    title: "Review your breakdown",
    body: "See your spending by category with clear charts, totals, and transaction-level detail.",
    image: "/analysisscreenshot.png",
  },
] as const;
