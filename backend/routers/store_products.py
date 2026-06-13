from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/store-products", tags=["store-products"])


class StoreProductCreate(BaseModel):
    upc: str
    upc_prom: Optional[str] = None
    id_product: int
    selling_price: Decimal
    products_number: int
    promotional_product: bool


class StoreProductUpdate(BaseModel):
    upc_prom: Optional[str] = None
    selling_price: Decimal
    products_number: int
    promotional_product: bool


@router.get("/")
async def get_store_products(
    promotional: Optional[bool] = None,
    sort_by: str = "name",
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    order_clause = " ORDER BY p.product_name"
    if sort_by == "quantity":
        order_clause = " ORDER BY sp.products_number"

    async with db.cursor() as cursor:
        query = """SELECT sp.*, p.product_name, p.manufacturer, c.category_name
                   FROM "Store_Product" sp
                   JOIN "Product" p ON p.id_product = sp.id_product
                   JOIN "Category" c ON c.category_number = p.category_number"""
        params = []
        
        if promotional is not None:
            query += " WHERE sp.promotional_product = %s"
            params.append(promotional)
            
        query += order_clause
        await cursor.execute(query, params)
        return await cursor.fetchall()

@router.get("/{upc}")
async def get_store_product_by_upc(
    upc: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT sp.selling_price, sp.products_number, p.product_name, p.characteristics
               FROM "Store_Product" sp
               JOIN "Product" p ON p.id_product = sp.id_product
               WHERE sp.upc = %s""",
            (upc,)
        )
        prod = await cursor.fetchone()
        if not prod:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        return prod

@router.post("/", status_code=201)
async def create_store_product(
    data: StoreProductCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                'SELECT 1 FROM "Store_Product" WHERE id_product = %s AND promotional_product = %s',
                (data.id_product, data.promotional_product)
            )
            if await cursor.fetchone():
                status_str = "Акційний" if data.promotional_product else "Звичайний"
                raise HTTPException(status_code=400, detail=f"Увага! {status_str} товар для базового ID {data.id_product} вже існує у магазині. Не можна додати його двічі.")
            await cursor.execute(
                """INSERT INTO "Store_Product" (upc, upc_prom, id_product, selling_price, products_number, promotional_product)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (data.upc, data.upc_prom, data.id_product, data.selling_price, data.products_number, data.promotional_product)
            )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Товар з таким UPC вже існує")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Вказаний товар або промо-UPC не існує")
    return {"message": "Товар у магазині створено"}


@router.put("/{upc}")
async def update_store_product(
    upc: str,
    data: StoreProductUpdate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute('SELECT id_product, promotional_product FROM "Store_Product" WHERE upc = %s', (upc,))
        current_prod = await cursor.fetchone()
        if not current_prod:
            raise HTTPException(status_code=404, detail="Товар у магазині не знайдено")
            
        if current_prod["promotional_product"] != data.promotional_product:
            await cursor.execute(
                'SELECT 1 FROM "Store_Product" WHERE id_product = %s AND promotional_product = %s AND upc != %s',
                (current_prod["id_product"], data.promotional_product, upc)
            )
            if await cursor.fetchone():
                status_str = "Акційний" if data.promotional_product else "Звичайний"
                raise HTTPException(status_code=400, detail=f"Увага! {status_str} товар для цього базового ID вже існує у магазині.")
            
        await cursor.execute(
            """UPDATE "Store_Product" SET upc_prom=%s, selling_price=%s, products_number=%s, promotional_product=%s
               WHERE upc=%s""",
            (data.upc_prom, data.selling_price, data.products_number, data.promotional_product, upc)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар у магазині не знайдено")
    return {"message": "Товар у магазині оновлено"}


@router.delete("/{upc}")
async def delete_store_product(
    upc: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute('DELETE FROM "Store_Product" WHERE upc = %s', (upc,))
            await db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Товар у магазині не знайдено")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Неможливо видалити — товар присутній у чеках")
    return {"message": "Товар видалено з магазину"}
