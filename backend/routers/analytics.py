from fastapi import APIRouter, Depends, HTTPException
import psycopg
from database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/vashchenko/cashier-stats/{card_number}")
async def get_cashier_stats_by_client(card_number: str, db: psycopg.AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                """
                SELECT e.id_employee, e.empl_surname, e.empl_name,
                       COUNT(r.receipt_number) AS receipt_count, SUM(r.sum_total) AS total_sum
                FROM "Employee" e
                JOIN "Receipt" r ON e.id_employee = r.id_employee
                JOIN "Customer_Card" c ON r.card_number = c.card_number
                WHERE c.card_number = %s
                GROUP BY e.id_employee, e.empl_surname, e.empl_name
                ORDER BY total_sum DESC;
                """, (card_number,)
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/vashchenko/promo-hunters")
async def get_promo_hunters(db: psycopg.AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                """
                SELECT c.card_number, c.cust_surname, c.cust_name
                FROM "Customer_Card" c
                WHERE NOT EXISTS (
                    SELECT sp.upc FROM "Store_Product" sp WHERE sp.promotional_product = TRUE
                    AND NOT EXISTS (
                        SELECT s.upc FROM "Sale" s JOIN "Receipt" r ON s.receipt_number = r.receipt_number
                        WHERE s.upc = sp.upc AND r.card_number = c.card_number
                    )
                );
                """
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/smyrnov/purchases-by-category/{card_number}")
async def smyrnov_purchases_by_category(card_number: str, db: psycopg.AsyncConnection = Depends(get_db)):
    async with db.cursor() as cursor:
        await cursor.execute(
            """
            SELECT c.category_name,
                   COUNT(DISTINCT r.receipt_number) AS receipt_count,
                   SUM(s.product_number) AS total_qty,
                   SUM(s.selling_price * s.product_number) AS total_sum
            FROM "Sale" s
            JOIN "Receipt" r ON r.receipt_number = s.receipt_number
            JOIN "Store_Product" sp ON sp.upc = s.upc
            JOIN "Product" p ON p.id_product = sp.id_product
            JOIN "Category" c ON c.category_number = p.category_number
            WHERE r.card_number = %s
            GROUP BY c.category_name
            ORDER BY total_sum DESC;
            """,
            (card_number,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


@router.get("/smyrnov/customers-never-bought/{upc}")
async def smyrnov_customers_never_bought(upc: str, db: psycopg.AsyncConnection = Depends(get_db)):
    async with db.cursor() as cursor:
        await cursor.execute(
            """
            SELECT cc.card_number, cc.cust_surname, cc.cust_name, cc.phone_number
            FROM "Customer_Card" cc
            WHERE NOT EXISTS (
                SELECT 1 FROM "Store_Product" sp
                WHERE sp.upc = %s
                AND NOT EXISTS (
                    SELECT 1 FROM "Sale" s
                    JOIN "Receipt" r ON s.receipt_number = r.receipt_number
                    WHERE s.upc = sp.upc
                      AND r.card_number = cc.card_number
                )
            )
            ORDER BY cc.cust_surname;
            """,
            (upc,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows] 

@router.get("/volik/cashier-revenue-by-category/{category_number}")
async def volik_cashier_revenue_by_category(category_number: int, db: psycopg.AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                """
                SELECT e.id_employee, e.empl_surname, e.empl_name, 
                       SUM(s.product_number) AS total_items_sold, 
                       SUM(s.product_number * s.selling_price) AS total_revenue
                FROM "Employee" e
                JOIN "Receipt" r ON e.id_employee = r.id_employee
                JOIN "Sale" s ON r.receipt_number = s.receipt_number
                JOIN "Store_Product" sp ON s.upc = sp.upc
                JOIN "Product" p ON sp.id_product = p.id_product
                WHERE p.category_number = %s
                GROUP BY e.id_employee, e.empl_surname, e.empl_name
                ORDER BY total_revenue DESC;
                """,
                (category_number,)
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/volik/receipts-with-all-category-products/{category_number}")
async def volik_receipts_with_all_category_products(category_number: int, db: psycopg.AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                """
                SELECT r.receipt_number, r.print_date, r.sum_total
                FROM "Receipt" r
                WHERE NOT EXISTS (
                    SELECT sp.upc
                    FROM "Store_Product" sp
                    JOIN "Product" p ON sp.id_product = p.id_product
                    WHERE p.category_number = %s
                    AND NOT EXISTS (
                        SELECT 1
                        FROM "Sale" s
                        WHERE s.receipt_number = r.receipt_number
                          AND s.upc = sp.upc
                    )
                );
                """,
                (category_number,)
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))