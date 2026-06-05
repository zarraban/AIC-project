from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductCreate(BaseModel):
    id_product: int
    category_number: int
    product_name: str
    manufacturer: str
    characteristics: str


class ProductUpdate(BaseModel):
    category_number: int
    product_name: str
    manufacturer: str
    characteristics: str


@router.get("/")
async def get_products(
    category_number: Optional[int] = None,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        if category_number is not None:
            await cursor.execute(
                """SELECT p.*, c.category_name
                   FROM "Product" p
                   JOIN "Category" c ON c.category_number = p.category_number
                   WHERE p.category_number = %s
                   ORDER BY p.product_name""",
                (category_number,)
            )
        else:
            await cursor.execute(
                """SELECT p.*, c.category_name
                   FROM "Product" p
                   JOIN "Category" c ON c.category_number = p.category_number
                   ORDER BY p.product_name"""
            )
        return await cursor.fetchall()


@router.post("/", status_code=201)
async def create_product(
    data: ProductCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                """INSERT INTO "Product" (id_product, category_number, product_name, manufacturer, characteristics)
                   VALUES (%s, %s, %s, %s, %s)""",
                (data.id_product, data.category_number, data.product_name, data.manufacturer, data.characteristics)
            )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Товар з таким ID вже існує")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Вказана категорія не існує")
    return {"message": "Товар створено"}


@router.put("/{id_product}")
async def update_product(
    id_product: int,
    data: ProductUpdate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                """UPDATE "Product" SET category_number=%s, product_name=%s, manufacturer=%s, characteristics=%s
                   WHERE id_product=%s""",
                (data.category_number, data.product_name, data.manufacturer, data.characteristics, id_product)
            )
            await db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Товар не знайдено")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Вказана категорія не існує")
    return {"message": "Товар оновлено"}


@router.delete("/{id_product}")
async def delete_product(
    id_product: int,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute('DELETE FROM "Product" WHERE id_product = %s', (id_product,))
            await db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Товар не знайдено")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Неможливо видалити товар — він присутній у магазині")
    return {"message": "Товар видалено"}
