from fastapi import APIRouter, Depends
from typing import Optional
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/sales-by-period")
async def sales_by_period(
    date_from: str,
    date_to: str,
    id_employee: Optional[str] = None,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        query_receipts = """SELECT r.receipt_number, r.print_date,
               e.empl_surname || ' ' || e.empl_name AS cashier,
               cc.cust_surname || ' ' || cc.cust_name AS customer,
               r.sum_total, r.vat
               FROM "Receipt" r
               JOIN "Employee" e ON e.id_employee = r.id_employee
               LEFT JOIN "Customer_Card" cc ON cc.card_number = r.card_number
               WHERE r.print_date BETWEEN %s::timestamp AND %s::timestamp"""
        params = [date_from, date_to]
        query_summary = """SELECT SUM(sum_total) AS total_sum, SUM(vat) AS total_vat, COUNT(*) AS count
               FROM "Receipt"
               WHERE print_date BETWEEN %s::timestamp AND %s::timestamp"""
        
        if id_employee:
            query_receipts += " AND r.id_employee = %s"
            query_summary += " AND id_employee = %s"
            params.append(id_employee)
        query_receipts += " ORDER BY r.print_date"
        
        await cursor.execute(query_receipts, params)
        receipts = await cursor.fetchall()

        await cursor.execute(query_summary, params)
        summary = await cursor.fetchone()

    return {"receipts": receipts, "summary": summary, "date_from": date_from, "date_to": date_to}


@router.get("/products-in-store")
async def products_in_store(
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT c.category_name, p.product_name, p.manufacturer,
               sp.upc, sp.selling_price, sp.products_number, sp.promotional_product
               FROM "Store_Product" sp
               JOIN "Product" p ON p.id_product = sp.id_product
               JOIN "Category" c ON c.category_number = p.category_number
               ORDER BY c.category_name, p.product_name"""
        )
        return await cursor.fetchall()


@router.get("/employee-sales")
async def employee_sales(
    date_from: str,
    date_to: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT e.id_employee, e.empl_surname || ' ' || e.empl_name AS cashier,
               COUNT(r.receipt_number) AS receipts_count,
               SUM(r.sum_total) AS total_sum
               FROM "Employee" e
               LEFT JOIN "Receipt" r ON r.id_employee = e.id_employee
               AND r.print_date BETWEEN %s::timestamp AND %s::timestamp
               WHERE e.empl_role = 'Cashier'
               GROUP BY e.id_employee, e.empl_surname, e.empl_name
               ORDER BY total_sum DESC NULLS LAST""",
            (date_from, date_to)
        )
        return await cursor.fetchall()


@router.get("/customer-purchases")
async def customer_purchases(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT cc.card_number, cc.cust_surname || ' ' || cc.cust_name AS customer,
               cc.percent AS discount_percent, cc.phone_number,
               COUNT(r.receipt_number) AS visits_count,
               COALESCE(SUM(r.sum_total), 0) AS total_spent
               FROM "Customer_Card" cc
               LEFT JOIN "Receipt" r ON r.card_number = cc.card_number
               AND (%s IS NULL OR r.print_date >= %s::timestamp)
               AND (%s IS NULL OR r.print_date <= %s::timestamp)
               GROUP BY cc.card_number, cc.cust_surname, cc.cust_name, cc.percent, cc.phone_number
               ORDER BY total_spent DESC""",
            (date_from, date_from, date_to, date_to)
        )
        return await cursor.fetchall()
