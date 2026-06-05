from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/receipts", tags=["receipts"])


class SaleItem(BaseModel):
    upc: str
    product_number: int


class ReceiptCreate(BaseModel):
    receipt_number: str
    card_number: Optional[str] = None
    items: List[SaleItem]


@router.get("/")
async def get_receipts(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        query = """SELECT r.*, e.empl_surname || ' ' || e.empl_name AS cashier_name,
                   cc.cust_surname || ' ' || cc.cust_name AS customer_name
                   FROM "Receipt" r
                   JOIN "Employee" e ON e.id_employee = r.id_employee
                   LEFT JOIN "Customer_Card" cc ON cc.card_number = r.card_number
                   WHERE 1=1"""
        params = []
        if current_user["role"] != "Manager":
            query += " AND r.id_employee = %s"
            params.append(current_user["id"])
        if date_from:
            query += " AND r.print_date >= %s::timestamp"
            params.append(date_from)
            
        if date_to:
            query += " AND r.print_date <= %s::timestamp"
            params.append(date_to)
        query += " ORDER BY r.print_date DESC"
        await cursor.execute(query, params)
        return await cursor.fetchall()


@router.get("/{receipt_number}")
async def get_receipt(
    receipt_number: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT r.*, e.empl_surname || ' ' || e.empl_name AS cashier_name,
               cc.cust_surname || ' ' || cc.cust_name AS customer_name
               FROM "Receipt" r
               JOIN "Employee" e ON e.id_employee = r.id_employee
               LEFT JOIN "Customer_Card" cc ON cc.card_number = r.card_number
               WHERE r.receipt_number = %s""",
            (receipt_number,)
        )
        receipt = await cursor.fetchone()
        if not receipt:
            raise HTTPException(status_code=404, detail="Чек не знайдено")

        await cursor.execute(
            """SELECT s.*, sp.upc, p.product_name, p.manufacturer
               FROM "Sale" s
               JOIN "Store_Product" sp ON sp.upc = s.upc
               JOIN "Product" p ON p.id_product = sp.id_product
               WHERE s.receipt_number = %s""",
            (receipt_number,)
        )
        items = await cursor.fetchall()

    return {**receipt, "items": items}


@router.post("/", status_code=201)
async def create_receipt(
    data: ReceiptCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        sum_total = Decimal("0")
        sale_rows = []

        for item in data.items:
            await cursor.execute(
                'SELECT selling_price, products_number FROM "Store_Product" WHERE upc = %s',
                (item.upc,)
            )
            sp = await cursor.fetchone()
            if not sp:
                raise HTTPException(status_code=400, detail=f"Товар з UPC {item.upc} не знайдено")
            if sp["products_number"] < item.product_number:
                raise HTTPException(status_code=400, detail=f"Недостатньо товару на складі (UPC: {item.upc})")
            row_total = sp["selling_price"] * item.product_number
            sum_total += row_total
            sale_rows.append((item.upc, sp["selling_price"], item.product_number))

        discount = Decimal("0")
        if data.card_number:
            await cursor.execute('SELECT percent FROM "Customer_Card" WHERE card_number = %s', (data.card_number,))
            card = await cursor.fetchone()
            if card:
                discount = sum_total * Decimal(card["percent"]) / 100

        final_total = sum_total - discount
        vat = final_total * Decimal("0.2")

        try:
            await cursor.execute(
                """INSERT INTO "Receipt" (receipt_number, id_employee, card_number, print_date, sum_total, vat)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (data.receipt_number, current_user["id"], data.card_number, datetime.now(), final_total, vat)
            )
            for upc, price, qty in sale_rows:
                await cursor.execute(
                    'INSERT INTO "Sale" (upc, receipt_number, product_number, selling_price) VALUES (%s, %s, %s, %s)',
                    (upc, data.receipt_number, qty, price)
                )
                await cursor.execute(
                    'UPDATE "Store_Product" SET products_number = products_number - %s WHERE upc = %s',
                    (qty, upc)
                )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Чек з таким номером вже існує")

    return {"message": "Чек створено", "receipt_number": data.receipt_number, "sum_total": str(final_total), "vat": str(vat)}


@router.delete("/{receipt_number}")
async def delete_receipt(
    receipt_number: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            'SELECT upc, product_number FROM "Sale" WHERE receipt_number = %s',
            (receipt_number,)
        )
        sales = await cursor.fetchall()
        for sale in sales:
            await cursor.execute(
                'UPDATE "Store_Product" SET products_number = products_number + %s WHERE upc = %s',
                (sale["product_number"], sale["upc"])
            )
        await cursor.execute('DELETE FROM "Receipt" WHERE receipt_number = %s', (receipt_number,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
    return {"message": "Чек видалено, кількість товарів відновлено"}
