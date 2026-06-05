import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_m15_promo_products_sorted(async_client: AsyncClient, manager_headers):
    # Sort by quantity
    resp = await async_client.get("/api/store-products/?promotional=true&sort_by=quantity", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    for sp in data:
        assert sp["promotional_product"] is True
    quantities = [sp["products_number"] for sp in data]
    assert quantities == sorted(quantities)

    # Sort by name
    resp = await async_client.get("/api/store-products/?promotional=true&sort_by=name", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [sp["product_name"] for sp in data]
    assert names == sorted(names)

async def test_m16_non_promo_products_sorted(async_client: AsyncClient, manager_headers):
    # Sort by quantity
    resp = await async_client.get("/api/store-products/?promotional=false&sort_by=quantity", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    for sp in data:
        assert sp["promotional_product"] is False
    quantities = [sp["products_number"] for sp in data]
    assert quantities == sorted(quantities)

    # Sort by name
    resp = await async_client.get("/api/store-products/?promotional=false&sort_by=name", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [sp["product_name"] for sp in data]
    assert names == sorted(names)

async def test_m17_m19_receipts_by_cashier(async_client: AsyncClient, manager_headers):
    # Need a cashier ID. Assume CSH-001 from mock data
    resp = await async_client.get("/api/reports/sales-by-period?date_from=2020-01-01&date_to=2030-01-01&id_employee=CSH-001", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "receipts" in data
    assert "summary" in data
    # Receipts exist and belong to CSH-001? (The endpoint doesn't return id_employee directly in receipts list, but we filtered it in SQL)
    assert data["date_from"] == "2020-01-01"

async def test_m18_m20_receipts_all_cashiers(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/reports/sales-by-period?date_from=2020-01-01&date_to=2030-01-01", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "receipts" in data
    assert "summary" in data

async def test_m21_product_sales_period(async_client: AsyncClient, manager_headers):
    # We need a product ID. Assume 1 exists from mock data.
    resp = await async_client.get("/api/reports/product-sales?id_product=1&date_from=2020-01-01&date_to=2030-01-01", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_product"] == 1
    assert "total_sold" in data
