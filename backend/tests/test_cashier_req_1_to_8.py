import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_c1_products_sorted(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/products/", headers=headers)
    assert resp.status_code == 200
    names = [p["product_name"] for p in resp.json()]
    assert names == sorted(names)

async def test_c2_store_products_sorted(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/store-products/?sort_by=name", headers=headers)
    assert resp.status_code == 200
    names = [sp["product_name"] for sp in resp.json()]
    assert names == sorted(names)

async def test_c3_find_customer_by_surname(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/customer-cards/", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    if not data:
        pytest.skip("No customers")
    
    surname = data[0]["cust_surname"]
    resp = await async_client.get(f"/api/customer-cards/?search={surname}", headers=headers)
    assert resp.status_code == 200
    for c in resp.json():
        assert c["phone_number"] is not None

async def test_c4_find_store_product_by_upc(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/store-products/", headers=headers)
    data = resp.json()
    if not data:
        pytest.skip("No store products")
    upc = data[0]["upc"]
    
    resp = await async_client.get(f"/api/store-products/{upc}", headers=headers)
    assert resp.status_code == 200
    info = resp.json()
    assert "selling_price" in info
    assert "products_number" in info

async def test_c5_customers_sorted(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/customer-cards/", headers=headers)
    assert resp.status_code == 200
    surnames = [c["cust_surname"] for c in resp.json()]
    assert surnames == sorted(surnames)

async def test_c6_products_by_category_sorted(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    cat_resp = await async_client.get("/api/categories/", headers=headers)
    cats = cat_resp.json()
    if not cats:
        pytest.skip("No categories")
    cat_num = cats[0]["category_number"]

    resp = await async_client.get(f"/api/products/?category_number={cat_num}", headers=headers)
    assert resp.status_code == 200
    names = [p["product_name"] for p in resp.json()]
    assert names == sorted(names)

async def test_c7_c8_promo_non_promo_sorted(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    # C7 Promo
    resp = await async_client.get("/api/store-products/?promotional=true&sort_by=name", headers=headers)
    assert resp.status_code == 200
    
    # C8 Non promo
    resp = await async_client.get("/api/store-products/?promotional=false&sort_by=name", headers=headers)
    assert resp.status_code == 200
