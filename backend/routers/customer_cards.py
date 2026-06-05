from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg
from database import get_db
from auth import get_current_user, require_manager

router = APIRouter(prefix="/api/customer-cards", tags=["customer-cards"])


class CustomerCardCreate(BaseModel):
    card_number: str
    cust_surname: str
    cust_name: str
    cust_patronymic: Optional[str] = None
    phone_number: str
    city: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[str] = None
    percent: int


class CustomerCardUpdate(BaseModel):
    cust_surname: str
    cust_name: str
    cust_patronymic: Optional[str] = None
    phone_number: str
    city: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[str] = None
    percent: int


@router.get("/")
async def get_customer_cards(
    search: Optional[str] = None,
    percent: Optional[int] = None,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        query = 'SELECT * FROM "Customer_Card" WHERE 1=1'
        params = []
        if search:
            query += ' AND LOWER(cust_surname) LIKE LOWER(%s)'
            params.append(f"%{search}%")
            
        if percent is not None:
            query += ' AND percent = %s'
            params.append(percent)
            
        query += ' ORDER BY cust_surname, cust_name'
        
        await cursor.execute(query, params)
        return await cursor.fetchall()


@router.post("/", status_code=201)
async def create_customer_card(
    data: CustomerCardCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                """INSERT INTO "Customer_Card"
                   (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (data.card_number, data.cust_surname, data.cust_name, data.cust_patronymic,
                 data.phone_number, data.city, data.street, data.zip_code, data.percent)
            )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Карта з таким номером вже існує")
    return {"message": "Карту клієнта створено"}


@router.put("/{card_number}")
async def update_customer_card(
    card_number: str,
    data: CustomerCardUpdate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """UPDATE "Customer_Card"
               SET cust_surname=%s, cust_name=%s, cust_patronymic=%s, phone_number=%s,
               city=%s, street=%s, zip_code=%s, percent=%s
               WHERE card_number=%s""",
            (data.cust_surname, data.cust_name, data.cust_patronymic, data.phone_number,
             data.city, data.street, data.zip_code, data.percent, card_number)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
    return {"message": "Карту клієнта оновлено"}


@router.delete("/{card_number}")
async def delete_customer_card(
    card_number: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute('DELETE FROM "Customer_Card" WHERE card_number = %s', (card_number,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
    return {"message": "Карту клієнта видалено"}
