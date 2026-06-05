import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login(async_client: AsyncClient, manager_headers):
    response = await async_client.get("/api/print/report/employees", headers=manager_headers)
    assert response.status_code == 200
