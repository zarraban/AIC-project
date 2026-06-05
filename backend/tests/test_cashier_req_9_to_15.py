import pytest
import time
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_c9_create_receipt(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    # Need a store product to sell
    sp_resp = await async_client.get("/api/store-products/", headers=headers)
    sp_data = sp_resp.json()
    if not sp_data:
        pytest.skip("No store products available to sell")
    
    upc = sp_data[0]["upc"]
    
    unique_receipt = f"RC-{int(time.time()) % 100000}"
    payload = {
        "receipt_number": unique_receipt,
        "items": [
            {"upc": upc, "product_number": 1}
        ]
    }
    resp = await async_client.post("/api/receipts/", json=payload, headers=headers)
    assert resp.status_code == 201

async def test_c10_c11_customer_crud(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    unique_card = f"C{int(time.time()) % 100000:010d}"
    
    # C10 Create
    payload = {
        "card_number": unique_card,
        "cust_surname": "CashierAdd",
        "cust_name": "Test",
        "phone_number": "+380000000001",
        "percent": 5
    }
    resp = await async_client.post("/api/customer-cards/", json=payload, headers=headers)
    assert resp.status_code == 201
    
    # C11 Edit
    payload["cust_name"] = "EditedByCashier"
    resp = await async_client.put(f"/api/customer-cards/{unique_card}", json=payload, headers=headers)
    assert resp.status_code == 200

async def test_c12_receipt_sum(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/receipts/", headers=headers)
    data = resp.json()
    if not data:
        pytest.skip("No receipts")
    
    receipt_num = data[0]["receipt_number"]
    resp = await async_client.get(f"/api/receipts/{receipt_num}", headers=headers)
    assert resp.status_code == 200
    assert "sum_total" in resp.json()

async def test_c13_receipts_by_period(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/receipts/?date_from=2020-01-01&date_to=2030-01-01", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

async def test_c14_total_sales_period(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/reports/my-sales?date_from=2020-01-01&date_to=2030-01-01", headers=headers)
    assert resp.status_code == 200
    assert "total_sum" in resp.json()

async def test_c15_total_product_sales_period(async_client: AsyncClient, cashier_token):
    headers = {"Authorization": f"Bearer {cashier_token}"}
    resp = await async_client.get("/api/reports/my-product-sales?id_product=1&date_from=2020-01-01&date_to=2030-01-01", headers=headers)
    assert resp.status_code == 200
    assert "total_sold" in resp.json()
