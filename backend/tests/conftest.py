import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import psycopg
from psycopg.rows import dict_row

from main import app
from database import get_db

# Override the database dependency to use the exposed test port 5433
async def override_get_db():
    conn = await psycopg.AsyncConnection.connect(
        "host=localhost port=5433 user=postgres password=postgres dbname=zlagoda_db",
        row_factory=dict_row
    )
    try:
        # Start a transaction so tests can be rolled back if needed
        # (Though we will just use the dev database state for now)
        yield conn
    finally:
        await conn.close()

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture()
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture()
async def manager_token(async_client: AsyncClient):
    # Log in as manager
    response = await async_client.post(
        "/api/auth/login",
        data={"username": "mgr1", "password": "admin"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200, f"Manager login failed: {response.text}"
    return response.json()["token"]

@pytest_asyncio.fixture()
async def cashier_token(async_client: AsyncClient):
    # Log in as cashier
    response = await async_client.post(
        "/api/auth/login",
        data={"username": "csh1", "password": "admin"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200, f"Cashier login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture
def manager_headers(manager_token: str):
    return {"Authorization": f"Bearer {manager_token}"}

@pytest.fixture
def cashier_headers(cashier_token: str):
    return {"Authorization": f"Bearer {cashier_token}"}
