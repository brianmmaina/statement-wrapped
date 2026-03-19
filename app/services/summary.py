"""LLM-powered spending summary generation."""

import logging

logger = logging.getLogger(__name__)


def generate_spending_summary(
    spending_by_category: dict[str, float],
    transaction_count: int,
    filename: str,
) -> str | None:
    """
    Generate a 2-3 paragraph AI summary of spending patterns.
    Returns None if OpenAI is unavailable or the call fails.
    """
    try:
        from app.core.config import OPENAI_API_KEY

        if not OPENAI_API_KEY:
            return None
    except ImportError:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        logger.warning("OpenAI client init failed for summary: %s", e)
        return None

    # Spending = positive amounts (outflows); Income = negative amounts (inflows)
    outflows = {k: v for k, v in spending_by_category.items() if v > 0}
    inflows = {k: abs(v) for k, v in spending_by_category.items() if v < 0}
    total_spending = sum(outflows.values())
    total_income = sum(inflows.values())
    if total_spending <= 0:
        return None

    spending_lines = [f"{cat}: ${v:.2f}" for cat, v in sorted(outflows.items(), key=lambda x: -x[1])]
    spending_text = "\n".join(spending_lines)
    income_lines = [f"{cat}: ${v:.2f}" for cat, v in sorted(inflows.items(), key=lambda x: -x[1])]
    income_text = "\n".join(income_lines) if income_lines else "None"

    net = total_income - total_spending
    prompt = f"""Summarize this statement analysis in 2-3 short, punchy paragraphs.

Statement: {filename}
Transactions: {transaction_count}

SPENDING (money out): ${total_spending:.2f}
By category:
{spending_text}

INCOME (money in): ${total_income:.2f}
By source:
{income_text}

Net: ${net:.2f} (income minus spending)

Guidelines:
- Lead with the most striking insight (e.g., "Groceries made up nearly half your spending" or "You spent $X across N transactions").
- Use a direct, conversational tone. Say "You spent" not "A total of X was recorded."
- Include percentages when helpful (e.g., "48% of spending").
- Mention income and net position if there is income.
- Give one specific, data-driven takeaway—avoid generic advice like "consider creating a budget."
- Keep it concise: 2-3 short paragraphs, no bullet points. Every sentence should earn its place."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content
        result = content.strip() if content else None
        if result:
            logger.info("Summary generated successfully (%d chars)", len(result))
        return result
    except Exception as e:
        logger.warning("Summary generation failed: %s", e)
        return None
