"""Wells Fargo parser tests."""

from pathlib import Path

from app.parsers.wells_fargo import WellsFargoParser

FIXTURES = Path(__file__).parent / "fixtures"


def test_wells_fargo_parser_sample_csv():
    parser = WellsFargoParser()
    path = FIXTURES / "sample_wells_fargo.csv"
    with open(path, "rb") as f:
        rows = parser.parse(f.read())
    assert len(rows) == 5
    assert "GAS" in rows[0].merchant or "STATION" in rows[0].merchant
    # Canonical: positive = outflow, negative = inflow. Wells Fargo negates to normalize.
    assert float(rows[0].amount) == 45.00  # Gas spending
    assert float(rows[2].amount) == -1200.00  # Direct dep income
