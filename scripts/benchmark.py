#!/usr/bin/env python3
"""Benchmark normalization pipeline and cache hit. Run from project root.

Usage:
  python3 scripts/benchmark.py              # normalization only (no API needed)
  python3 scripts/benchmark.py --cache      # cache hit (requires API + prior ingest)
"""

import sys
import time

# Add project root to path
sys.path.insert(0, ".")

from app.parsers import parse_file


def make_100_row_chase_csv() -> bytes:
    """Generate a 100-row Chase-format CSV for benchmarking."""
    header = "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\n"
    rows = [
        "ACCOUNT PURCHASE,01/15/2024,AMAZON.COM,45.99,Debit,1234.56,\n",
        "POS PURCHASE,01/14/2024,WHOLE FOODS MARKET,78.32,Debit,1280.55,\n",
        "ACCOUNT PURCHASE,01/13/2024,NETFLIX.COM,15.99,Debit,1358.87,\n",
        "CREDIT,01/12/2024,PAYMENT RECEIVED,-500.00,Credit,1374.86,\n",
        "ACCOUNT PURCHASE,01/11/2024,UBER TRIP,23.45,Debit,1874.86,\n",
        "ACCOUNT PURCHASE,01/10/2024,STARBUCKS #12345,6.50,Debit,1898.31,\n",
        "POS PURCHASE,01/09/2024,SHELL OIL 12345678,52.00,Debit,1904.81,\n",
        "ACCOUNT PURCHASE,01/08/2024,SPOTIFY,9.99,Debit,1956.81,\n",
        "ACCOUNT PURCHASE,01/07/2024,AMAZON.COM,32.50,Debit,1966.80,\n",
        "POS PURCHASE,01/06/2024,WHOLE FOODS MARKET,89.23,Debit,1999.30,\n",
    ]
    # Repeat to get 100 rows
    body = "".join(rows * 10)
    return (header + body).encode("utf-8")


def benchmark_normalization(iterations: int = 10) -> float:
    """Measure parse_file (normalization) time for 100-row CSV. Returns median ms."""
    content = make_100_row_chase_csv()
    times_ms = []
    for _ in range(iterations):
        start = time.perf_counter()
        parse_file("chase", content)
        elapsed_ms = (time.perf_counter() - start) * 1000
        times_ms.append(elapsed_ms)
    times_ms.sort()
    return times_ms[len(times_ms) // 2]


def benchmark_cache_hit(statement_id: int = 1, iterations: int = 20, base_url: str = "http://localhost:8000") -> float | None:
    """Measure GET /analysis/{id} cache hit time. Returns median ms or None if API unavailable."""
    try:
        import httpx
    except ImportError:
        print("  (httpx required for cache benchmark: pip install httpx)")
        return None
    times_ms = []
    for _ in range(iterations):
        start = time.perf_counter()
        try:
            r = httpx.get(f"{base_url}/analysis/{statement_id}", timeout=5.0)
            if r.status_code != 200:
                return None
        except Exception:
            return None
        elapsed_ms = (time.perf_counter() - start) * 1000
        times_ms.append(elapsed_ms)
    times_ms.sort()
    return times_ms[len(times_ms) // 2]


if __name__ == "__main__":
    print("Benchmarking normalization pipeline (100-row Chase CSV)...")
    median_ms = benchmark_normalization()
    print(f"  Median: {median_ms:.1f} ms")
    print(f"\nUse for README: Normalization pipeline: ~{max(1, int(round(median_ms)))} ms")

    if "--cache" in sys.argv:
        print("\nBenchmarking cache hit (GET /analysis/1)...")
        cache_ms = benchmark_cache_hit()
        if cache_ms is not None:
            print(f"  Median: {cache_ms:.1f} ms")
            print(f"\nUse for README: Cache hit response time: ~{int(round(cache_ms))} ms")
        else:
            print("  (API not running or statement_id 1 not cached. Run ingest first.)")
