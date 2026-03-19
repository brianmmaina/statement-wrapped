"""Test categorization with fixture CSVs. Verifies rule-based and LLM categorization."""

from pathlib import Path

import pytest

from app.parsers import parse_file
from app.services.categorization import categorize_transactions

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.mark.parametrize(
    "bank_type,filename,expected",
    [
        # Chase: AMAZON->shopping, WHOLE FOODS->groceries, NETFLIX->subscriptions, PAYMENT RECEIVED->income, UBER->transport
        (
            "chase",
            "sample_chase.csv",
            {
                "AMAZON.COM": "shopping",
                "WHOLE FOODS MARKET": "groceries",
                "NETFLIX.COM": "subscriptions",
                "PAYMENT RECEIVED": "income",
                "UBER TRIP": "transport",
            },
        ),
        # Chase extended fixture
        (
            "chase",
            "chase_sample.csv",
            {
                "AMAZON.COM": "shopping",
                "WHOLE FOODS MARKET": "groceries",
                "NETFLIX.COM": "subscriptions",
                "PAYMENT RECEIVED": "income",
                "UBER TRIP": "transport",
                "STARBUCKS": "dining",
                "SHELL OIL": "transport",
                "SPOTIFY": "subscriptions",
                "CHIPOTLE": "dining",
                "Lyft": "transport",
                "TARGET": "shopping",
                "COFFEE SHOP CAFE": "dining",
                "CHEVRON": "transport",
                "UBER EATS": "dining",
            },
        ),
        # BoA: STARBUCKS->dining, SHELL->transport, SPOTIFY->subscriptions, DIRECT DEPOSIT->income, AMAZON->shopping
        (
            "boa",
            "sample_boa.csv",
            {
                "STARBUCKS #12345": "dining",
                "SHELL OIL 12345678": "transport",
                "SPOTIFY": "subscriptions",
                "DIRECT DEPOSIT": "income",
                "AMAZON MKTPLACE": "shopping",
            },
        ),
        # Wells Fargo: GAS STATION->transport, GROCERY STORE->groceries, DIRECT DEP->income, COFFEE SHOP->dining
        (
            "wells_fargo",
            "sample_wells_fargo.csv",
            {
                "GAS STATION 123": "transport",
                "GROCERY STORE": "groceries",
                "DIRECT DEP": "income",
                "ONLINE PAYMENT": "other",  # or income if payment reduces balance - depends on context
                "COFFEE SHOP": "dining",
            },
        ),
        # Apple Card: PAYMENT is user paying card bill (outflow), not income.
        # APPLE.COM/BILL: rule-based gives other; LLM may say subscriptions/utilities
        (
            "apple_card",
            "sample_apple_card.csv",
            {
                "APPLE.COM/BILL": ("other", "subscriptions", "utilities"),
                "UBER TRIP": "transport",
                "SPOTIFY": "subscriptions",
                "PAYMENT": ("other", "income"),  # rule-based: other; LLM may say income (payment received)
                "WHOLE FOODS": "groceries",
            },
        ),
    ],
)
def test_categorization_fixtures(bank_type, filename, expected):
    """Parse CSV and verify each merchant gets the expected category."""
    path = FIXTURES / filename
    if not path.exists():
        pytest.skip(f"Fixture {filename} not found")
    with open(path, "rb") as f:
        rows = parse_file(bank_type, f.read())
    assert len(rows) > 0, f"Expected rows from {filename}"
    slugs = categorize_transactions(rows)
    assert len(slugs) == len(rows), f"Expected {len(rows)} categories, got {len(slugs)}"
    for i, row in enumerate(rows):
        merchant = row.merchant
        if merchant in expected:
            exp = expected[merchant]
            if isinstance(exp, tuple):
                assert slugs[i] in exp, f"{merchant}: expected one of {exp}, got {slugs[i]}"
            else:
                assert slugs[i] == exp, f"{merchant}: expected {exp}, got {slugs[i]}"
