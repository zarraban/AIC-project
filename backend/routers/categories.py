from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    category_number: int
    category_name: str


class CategoryUpdate(BaseModel):
    category_name: str


@router.get("/")
async def get_categories(
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute('SELECT * FROM "Category" ORDER BY category_number')
        return await cursor.fetchall()


@router.post("/", status_code=201)
async def create_category(
    data: CategoryCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                'INSERT INTO "Category" (category_number, category_name) VALUES (%s, %s)',
                (data.category_number, data.category_name)
            )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Категорія з таким номером вже існує")
    return {"message": "Категорію створено"}


@router.put("/{category_number}")
async def update_category(
    category_number: int,
    data: CategoryUpdate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            'UPDATE "Category" SET category_name = %s WHERE category_number = %s',
            (data.category_name, category_number)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
    return {"message": "Категорію оновлено"}


@router.delete("/{category_number}")
async def delete_category(
    category_number: int,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                'DELETE FROM "Category" WHERE category_number = %s',
                (category_number,)
            )
            await db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Категорію не знайдено")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Неможливо видалити категорію — є пов'язані товари")
    return {"message": "Категорію видалено"}
