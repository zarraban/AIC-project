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


#
#
#

@router.get("/teammate2/query1/{param}")
async def t2_query1(param: str, db: psycopg.AsyncConnection = Depends(get_db)):

    return []

@router.get("/teammate2/query2")
async def t2_query2(db: psycopg.AsyncConnection = Depends(get_db)):

    return []


#
#
#

@router.get("/teammate3/query1/{param}")
async def t3_query1(param: str, db: psycopg.AsyncConnection = Depends(get_db)):

    return []

@router.get("/teammate3/query2")
async def t3_query2(db: psycopg.AsyncConnection = Depends(get_db)):

    return []