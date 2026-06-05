import pytest
import time
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_manager_crud_flow(async_client: AsyncClient, manager_headers):
    # Use a unique timestamp-based ID to avoid collisions
    unique_id = int(time.time()) % 100000
    cat_id = unique_id
    prod_id = unique_id
    upc = f"{unique_id:012d}"
    card_number = f"C{unique_id:012d}"

    # --- CREATE (M1) ---
    # Category
    resp = await async_client.post("/api/categories/", json={"category_number": cat_id, "category_name": f"Test Cat {cat_id}"}, headers=manager_headers)
    assert resp.status_code in [200, 201], resp.text
    
    # Product
    resp = await async_client.post("/api/products/", json={
        "id_product": prod_id, "category_number": cat_id, "product_name": "Test Product",
        "manufacturer": "Test Manuf", "characteristics": "Test Char"
    }, headers=manager_headers)
    assert resp.status_code in [200, 201], resp.text

    # Store Product
    resp = await async_client.post("/api/store-products/", json={
        "upc": upc, "id_product": prod_id, "selling_price": 10.50,
        "products_number": 100, "promotional_product": False
    }, headers=manager_headers)
    assert resp.status_code in [200, 201], resp.text

    # Customer
    resp = await async_client.post("/api/customer-cards/", json={
        "card_number": card_number, "cust_surname": "Test", "cust_name": "Test",
        "phone_number": f"+38{unique_id:010d}", "percent": 5, "city": "Kyiv", "street": "Test", "zip_code": "00000"
    }, headers=manager_headers)
    assert resp.status_code in [200, 201], resp.text

    # --- EDIT (M2) ---
    resp = await async_client.put(f"/api/categories/{cat_id}", json={"category_name": "Edited Category"}, headers=manager_headers)
    assert resp.status_code == 200, resp.text
    
    resp = await async_client.put(f"/api/products/{prod_id}", json={
        "category_number": cat_id, "product_name": "Edited Product",
        "manufacturer": "Edited Manuf", "characteristics": "Edited Char"
    }, headers=manager_headers)
    assert resp.status_code == 200, resp.text

    # --- DELETE (M3) ---
    resp = await async_client.delete(f"/api/store-products/{upc}", headers=manager_headers)
    assert resp.status_code == 200, resp.text
    
    resp = await async_client.delete(f"/api/products/{prod_id}", headers=manager_headers)
    assert resp.status_code == 200, resp.text
    
    resp = await async_client.delete(f"/api/categories/{cat_id}", headers=manager_headers)
    assert resp.status_code == 200, resp.text
    
    resp = await async_client.delete(f"/api/customer-cards/{card_number}", headers=manager_headers)
    assert resp.status_code == 200, resp.text

async def test_m4_print_reports(async_client: AsyncClient, manager_headers):
    endpoints = [
        "/api/print/report/employees",
        "/api/print/report/customers",
        "/api/print/report/categories",
        "/api/print/report/products",
        "/api/print/report/store-products",
        "/api/print/report/receipts"
    ]
    for ep in endpoints:
        resp = await async_client.get(ep, headers=manager_headers)
        assert resp.status_code == 200
        assert "html" in resp.headers.get("content-type", "").lower()
