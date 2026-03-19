"""Health endpoint tests."""

import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    """GET /health returns status, database, redis, openai_configured."""
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "database" in data
    assert "redis" in data
    assert "openai_configured" in data
