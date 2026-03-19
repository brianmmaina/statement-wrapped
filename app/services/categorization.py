"""LLM-powered transaction categorization with rule-based fallback."""

import json
import logging
import re
from collections.abc import Sequence

from app.services.normalization import NormalizedTransaction

try:
    from json_repair import loads as json_repair_loads
except ImportError:
    json_repair_loads = None

logger = logging.getLogger(__name__)

CATEGORIES = (
    "income",
    "dining",
    "groceries",
    "transport",
    "subscriptions",
    "entertainment",
    "shopping",
    "utilities",
    "other",
)

# OpenAI Structured Outputs schema: guarantees {"categories": ["slug", ...]} format
# https://platform.openai.com/docs/guides/structured-outputs
CATEGORIZATION_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "transaction_categories",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "categories": {
                    "type": "array",
                    "items": {"type": "string", "enum": list(CATEGORIES)},
                    "description": "Category slug for each transaction in order",
                }
            },
            "required": ["categories"],
            "additionalProperties": False,
        },
    },
}

# Rule-based fallback: keyword patterns -> category (checked in order, first match wins)
# Income patterns first (negative amounts = inflows); then spending patterns
RULE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(direct deposit|payment received|payroll|salary|deposit|transfer in|refund)\b", re.I), "income"),
    (re.compile(r"\b(netflix|spotify|hulu|disney\+|hbo|paramount|peacock)\b", re.I), "subscriptions"),
    (re.compile(r"\b(whole foods|trader joe|safeway|kroger|albertsons|publix|wegmans)\b", re.I), "groceries"),
    (re.compile(r"\b(amazon|target|walmart|costco|best buy|ebay)\b", re.I), "shopping"),
    (re.compile(r"\b(starbucks|chipotle|mcdonald|burger king|taco bell|uber eats|doordash|grubhub)\b", re.I), "dining"),
    (re.compile(r"\b(uber|lyft|shell|chevron|exxon|mobil|bp\b|gas station)\b", re.I), "transport"),
    (re.compile(r"\b(utility|electric|water|comcast|verizon|at&t)\b", re.I), "utilities"),
    (re.compile(r"\b(coffee|cafe|restaurant|bar|pizza|diner)\b", re.I), "dining"),
]


def _rule_based_categorize(transactions: Sequence[NormalizedTransaction]) -> list[str]:
    """Fallback: categorize by keyword matching when LLM is unavailable."""
    result = []
    for t in transactions:
        text = f"{t.merchant} {t.raw_description or ''}".lower()
        slug = "other"
        for pattern, cat in RULE_PATTERNS:
            if pattern.search(text):
                slug = cat
                break
        # Negative amount = inflow; if no income pattern matched, still tag as income
        if slug == "other" and t.amount < 0:
            slug = "income"
        result.append(slug)
    return result


def categorize_transactions(
    transactions: Sequence[NormalizedTransaction],
) -> list[str]:
    """
    Assign a category slug to each transaction via a single batched LLM call.
    Returns a list of slugs in the same order as the input.
    On API failure or parse error, returns "other" for all.
    """
    if not transactions:
        return []

    try:
        from app.core.config import OPENAI_API_KEY

        if not OPENAI_API_KEY:
            logger.info("OPENAI_API_KEY not set; using rule-based categorization")
            return _rule_based_categorize(transactions)
    except ImportError:
        return _rule_based_categorize(transactions)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        logger.warning("OpenAI client init failed: %s; using rule-based fallback", e)
        return _rule_based_categorize(transactions)

    # build compact input for prompt; truncate long descriptions
    items = []
    for t in transactions:
        desc = (t.raw_description or t.merchant or "")[:200]
        items.append(f"{t.merchant}|{t.amount}|{desc}")

    prompt = f"""Categorize each transaction into exactly one category. Assign one category per transaction in the same order.

IMPORTANT: Negative amounts = money received (income). Use "income" for those. Positive amounts = money spent. Use spending categories (dining, groceries, transport, etc.).

Transactions (merchant|amount|description):
{chr(10).join(items)}

Return ONLY valid JSON. No explanation, no markdown, no other text. A single JSON object with a "categories" key: an array of exactly {len(transactions)} slugs in order. Use only these slugs: {', '.join(CATEGORIES)}."""

    def _parse_categories(content: str) -> list[str] | None:
        """Extract categories from LLM response. Uses json_repair if standard parse fails."""
        if not content or not content.strip():
            return None
        raw = content.strip()
        if "```" in raw:
            for m in ("```json", "```"):
                if m in raw:
                    raw = raw.split(m)[1].strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            if json_repair_loads:
                try:
                    parsed = json_repair_loads(raw)
                except (json.JSONDecodeError, TypeError, ValueError):
                    return None
            else:
                return None
        slugs_raw = parsed.get("categories") or parsed.get("result")
        if slugs_raw is None:
            tx_list = parsed.get("transactions") or parsed.get("items")
            if isinstance(tx_list, list) and tx_list:
                slugs_raw = [
                    t.get("category") or t.get("slug") if isinstance(t, dict) else t
                    for t in tx_list
                ]
        if not isinstance(slugs_raw, list) or len(slugs_raw) != len(transactions):
            return None
        valid = set(CATEGORIES)
        result = []
        for i, s in enumerate(slugs_raw):
            if isinstance(s, dict):
                slug = s.get("category") or s.get("slug") or ""
            else:
                slug = str(s).strip().lower() if s else ""
            slug = slug if slug in valid else "other"
            # Negative amount = income; override if LLM returned a spending category
            if i < len(transactions) and transactions[i].amount < 0 and slug != "income":
                slug = "income"
            result.append(slug)
        return result

    MAX_RETRIES = 2  # Retry when parsing fails (up to 3 total attempts)
    use_structured = True  # Try structured first; fall back to json_object if it fails

    try:
        content = ""
        for attempt in range(MAX_RETRIES + 1):
            response_format = CATEGORIZATION_SCHEMA if use_structured else {"type": "json_object"}
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format=response_format,
                )
            except Exception as api_err:
                if use_structured:
                    logger.info("Structured output failed (%s), switching to json_object", api_err)
                    use_structured = False
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                    )
                else:
                    raise

            msg = response.choices[0].message
            if getattr(msg, "refusal", None):
                logger.warning("LLM refused: %s; using rule-based fallback", msg.refusal)
                return _rule_based_categorize(transactions)
            content = msg.content or ""

            result = _parse_categories(content)
            if result is not None and not all(s == "other" for s in result):
                return result

            if attempt < MAX_RETRIES:
                logger.info("Parse failed (attempt %d/%d), retrying LLM call", attempt + 1, MAX_RETRIES + 1)
            else:
                logger.warning(
                    "LLM returned invalid format after %d attempts (expected %d categories). content=%s",
                    MAX_RETRIES + 1,
                    len(transactions),
                    repr(content[:300]) if content else "empty",
                )
                return _rule_based_categorize(transactions)
    except Exception as e:
        logger.warning("LLM categorization failed: %s; using rule-based fallback", e)
        return _rule_based_categorize(transactions)
