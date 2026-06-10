import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_m5_all_employees_sorted(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/employees/", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    # Check sorting by surname
    surnames = [e["empl_surname"] for e in data]
    assert surnames == sorted(surnames), "Employees are not sorted by surname"

async def test_m6_cashiers_sorted(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/employees/cashiers", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    # Check sorting
    surnames = [e["empl_surname"] for e in data]
    assert surnames == sorted(surnames), "Cashiers are not sorted by surname"

async def test_m7_customers_sorted(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/customer-cards/", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    surnames = [c["cust_surname"] for c in data]
    assert surnames == sorted(surnames), "Customers are not sorted by surname"

async def test_m8_categories_sorted(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/categories/", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [c["category_name"] for c in data]
    assert names == sorted(names), "ProductsCategories are not sorted by name"

async def test_m9_products_sorted(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/products/", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [p["product_name"] for p in data]
    assert names == sorted(names), "Products are not sorted by name"

async def test_m10_store_products_sorted_by_quantity(async_client: AsyncClient, manager_headers):
    resp = await async_client.get("/api/store-products/?sort_by=quantity", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    quantities = [sp["products_number"] for sp in data]
    assert quantities == sorted(quantities), "Store products are not sorted by quantity"
