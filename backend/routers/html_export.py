from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import psycopg
import datetime
import os
from database import get_db
from auth import get_current_user
router = APIRouter(prefix="/api/print", tags=["Print Export"])
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)
@router.get("/receipt/{check_number}", response_class=HTMLResponse)
async def print_receipt(
    request: Request,
    check_number: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT r.receipt_number as check_number, r.print_date, r.sum_total, r.vat,
                   e.empl_surname, e.empl_name, c.cust_surname, c.percent
            FROM "Receipt" r
            JOIN "Employee" e ON r.id_employee = e.id_employee
            LEFT JOIN "Customer_Card" c ON r.card_number = c.card_number
            WHERE r.receipt_number = %s
        """, (check_number,))
        receipt = await cursor.fetchone()
        if not receipt:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        await cursor.execute("""
            SELECT p.product_name, s.product_number, s.selling_price
            FROM "Sale" s
            JOIN "Store_Product" sp ON s.upc = sp.upc
            JOIN "Product" p ON sp.id_product = p.id_product
            WHERE s.receipt_number = %s
        """, (check_number,))
        sales = await cursor.fetchall()
    headers = ["Товар", "Кіл-ть", "Ціна", "Сума"]
    data = []
    for sale in sales:
        total = float(sale['selling_price']) * sale['product_number']
        data.append([
            sale['product_name'],
            sale['product_number'],
            f"{float(sale['selling_price']):.2f}",
            f"{total:.2f}"
        ])
    receipt_data = {
        "check_number": receipt['check_number'],
        "date": receipt['print_date'].strftime('%Y-%m-%d %H:%M:%S'),
        "cashier": f"{receipt['empl_name']} {receipt['empl_surname']}",
        "customer": receipt['cust_surname'] if receipt['cust_surname'] else None,
        "discount": receipt['percent'] if receipt['cust_surname'] else 0,
        "vat": f"{float(receipt['vat']):.2f}",
        "total": f"{float(receipt['sum_total']):.2f}"
    }
    return templates.TemplateResponse(
        request=request,
        name="report.html",
        context={
            "title": "Фіскальний чек",
            "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
            "headers": headers,
            "data": data,
            "is_receipt": True,
            "receipt_data": receipt_data
        }
    )
@router.get("/report/employees", response_class=HTMLResponse)
async def print_employees_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT id_employee, empl_surname, empl_name, empl_role, salary, phone_number
            FROM "Employee"
            ORDER BY empl_surname, empl_name
        """)
        employees = await cursor.fetchall()
        
    headers = ["ID", "Прізвище", "Ім'я", "Посада", "Телефон", "Зарплата"]
    data = [[e['id_employee'], e['empl_surname'], e['empl_name'], e['empl_role'], e['phone_number'], f"{float(e['salary']):.2f}"] for e in employees]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Працівники", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })
@router.get("/report/customers", response_class=HTMLResponse)
async def print_customers_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT card_number, cust_surname, cust_name, phone_number, percent
            FROM "Customer_Card"
            ORDER BY cust_surname
        """)
        customers = await cursor.fetchall()
        
    headers = ["Номер картки", "Прізвище", "Ім'я", "Телефон", "Знижка %"]
    data = [[c['card_number'], c['cust_surname'], c['cust_name'], c['phone_number'], f"{c['percent']}%"] for c in customers]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Постійні клієнти", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })
@router.get("/report/categories", response_class=HTMLResponse)
async def print_categories_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute('SELECT category_number, category_name FROM "Category" ORDER BY category_name')
        cats = await cursor.fetchall()
        
    headers = ["ID Категорії", "Назва категорії"]
    data = [[c['category_number'], c['category_name']] for c in cats]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Категорії товарів", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })
@router.get("/report/products", response_class=HTMLResponse)
async def print_products_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT p.id_product, p.product_name, c.category_name, p.manufacturer
            FROM "Product" p
            JOIN "Category" c ON p.category_number = c.category_number
            ORDER BY p.product_name
        """)
        prods = await cursor.fetchall()
        
    headers = ["ID Товар", "Назва", "Категорія", "Виробник"]
    data = [[p['id_product'], p['product_name'], p['category_name'], p['manufacturer']] for p in prods]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Всі Товари", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })
@router.get("/report/store-products", response_class=HTMLResponse)
async def print_store_products_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT sp.upc, p.product_name, sp.selling_price, sp.products_number, sp.promotional_product
            FROM "Store_Product" sp
            JOIN "Product" p ON sp.id_product = p.id_product
            ORDER BY p.product_name
        """)
        sp = await cursor.fetchall()
        
    headers = ["UPC", "Товар", "Ціна", "Кількість", "Акція"]
    data = [[s['upc'], s['product_name'], f"{float(s['selling_price']):.2f}", s['products_number'], "Так" if s['promotional_product'] else "Ні"] for s in sp]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Товари в магазині", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })
@router.get("/report/receipts", response_class=HTMLResponse)
async def print_receipts_report(
    request: Request,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ заборонено")
        
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT r.receipt_number, r.print_date, e.empl_surname, r.sum_total
            FROM "Receipt" r
            JOIN "Employee" e ON r.id_employee = e.id_employee
            ORDER BY r.print_date DESC
        """)
        receipts = await cursor.fetchall()
        
    headers = ["Номер Чеку", "Дата", "Касир", "Сума"]
    data = [[r['receipt_number'], r['print_date'].strftime('%Y-%m-%d %H:%M'), r['empl_surname'], f"{float(r['sum_total']):.2f}"] for r in receipts]
    
    return templates.TemplateResponse(request=request, name="report.html", context={
        "title": "Звіт: Всі Чеки", "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        "headers": headers, "data": data, "is_receipt": False
    })