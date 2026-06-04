from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import date
import psycopg
from database import get_db
from auth import get_current_user, require_manager, hash_password

router = APIRouter(prefix="/api/employees", tags=["employees"])


class EmployeeCreate(BaseModel):
    id_employee: str
    empl_surname: str
    empl_name: str
    empl_patronymic: Optional[str] = None
    empl_role: str
    salary: Decimal
    date_of_birth: date
    date_of_start: date
    phone_number: str
    city: str
    street: str
    zip_code: str
    login: str
    password: str


class EmployeeUpdate(BaseModel):
    empl_surname: str
    empl_name: str
    empl_patronymic: Optional[str] = None
    empl_role: str
    salary: Decimal
    date_of_birth: date
    date_of_start: date
    phone_number: str
    city: str
    street: str
    zip_code: str


class PasswordChange(BaseModel):
    new_password: str


@router.get("/")
async def get_employees(
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT e.*, ea.login
               FROM "Employee" e
               LEFT JOIN "Employee_Auth" ea ON ea.id_employee = e.id_employee
               ORDER BY e.empl_surname, e.empl_name"""
        )
        return await cursor.fetchall()


@router.get("/cashiers")
async def get_cashiers(
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT id_employee, empl_surname, empl_name, empl_patronymic
               FROM "Employee" WHERE empl_role = 'Cashier'
               ORDER BY empl_surname"""
        )
        return await cursor.fetchall()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/", status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute(
                """INSERT INTO "Employee" (id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
                   salary, date_of_birth, date_of_start, phone_number, city, street, zip_code)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (data.id_employee, data.empl_surname, data.empl_name, data.empl_patronymic,
                 data.empl_role, data.salary, data.date_of_birth, data.date_of_start,
                 data.phone_number, data.city, data.street, data.zip_code)
            )
            await cursor.execute(
                """INSERT INTO "Employee_Auth" (id_employee, login, password_hash) VALUES (%s, %s, %s)""",
                (data.id_employee, data.login, hash_password(data.password))
            )
            await db.commit()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=400, detail="Співробітник з таким ID або логіном вже існує")
    return {"message": "Співробітника створено"}


@router.put("/{id_employee}")
async def update_employee(
    id_employee: str,
    data: EmployeeUpdate,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """UPDATE "Employee" SET empl_surname=%s, empl_name=%s, empl_patronymic=%s, empl_role=%s,
               salary=%s, date_of_birth=%s, date_of_start=%s, phone_number=%s, city=%s, street=%s, zip_code=%s
               WHERE id_employee=%s""",
            (data.empl_surname, data.empl_name, data.empl_patronymic, data.empl_role,
             data.salary, data.date_of_birth, data.date_of_start, data.phone_number,
             data.city, data.street, data.zip_code, id_employee)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Співробітника не знайдено")
    return {"message": "Дані співробітника оновлено"}


@router.put("/{id_employee}/password")
async def change_password(
    id_employee: str,
    data: PasswordChange,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            'UPDATE "Employee_Auth" SET password_hash=%s WHERE id_employee=%s',
            (hash_password(data.new_password), id_employee)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Співробітника не знайдено")
    return {"message": "Пароль змінено"}


@router.delete("/{id_employee}")
async def delete_employee(
    id_employee: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(require_manager)
):
    async with db.cursor() as cursor:
        try:
            await cursor.execute('DELETE FROM "Employee" WHERE id_employee = %s', (id_employee,))
            await db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Співробітника не знайдено")
        except psycopg.errors.ForeignKeyViolation:
            raise HTTPException(status_code=400, detail="Неможливо видалити — є пов'язані чеки")
    return {"message": "Співробітника видалено"}
