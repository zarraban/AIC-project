import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_m11_employee_phone_and_address(async_client: AsyncClient, manager_headers):
    # Find employee by surname
    # Assuming there's at least one employee from initial data
    resp = await async_client.get("/api/employees/", headers=manager_headers)
    assert resp.status_code == 200
    employees = resp.json()
    if not employees:
        pytest.skip("No employees found to test")
    
    surname = employees[0]["empl_surname"]
    
    # Test M11 requirement filter
    resp = await async_client.get(f"/api/employees/?surname={surname}", headers=manager_headers)
    assert resp.status_code == 200
    filtered = resp.json()
    assert len(filtered) > 0
    # Must return phone and address (city, street, zip)
    for emp in filtered:
        assert "phone_number" in emp
        assert "city" in emp
        assert "street" in emp
        assert "zip_code" in emp

async def test_m12_customers_by_percent(async_client: AsyncClient, manager_headers):
    percent = 5
    resp = await async_client.get(f"/api/customer-cards/?percent={percent}", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    for c in data:
        assert c["percent"] == percent

async def test_m13_products_by_category_sorted(async_client: AsyncClient, manager_headers):
    # Get categories to find a valid category_number
    cat_resp = await async_client.get("/api/categories/", headers=manager_headers)
    cats = cat_resp.json()
    if not cats:
        pytest.skip("No categories")
    cat_num = cats[0]["category_number"]

    resp = await async_client.get(f"/api/products/?category_number={cat_num}", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    
    names = []
    for p in data:
        assert p["category_number"] == cat_num
        names.append(p["product_name"])
    
    # M13 requires sorting by name
    assert names == sorted(names)

async def test_m14_upc_info(async_client: AsyncClient, manager_headers):
    # Get a store product first
    sp_resp = await async_client.get("/api/store-products/", headers=manager_headers)
    sp_data = sp_resp.json()
    if not sp_data:
        pytest.skip("No store products")
    upc = sp_data[0]["upc"]

    resp = await async_client.get(f"/api/store-products/{upc}", headers=manager_headers)
    assert resp.status_code == 200
    data = resp.json()
    # Check fields required by M14: selling_price, products_number, product_name, characteristics
    assert "selling_price" in data
    assert "products_number" in data
    assert "product_name" in data
    assert "characteristics" in data
