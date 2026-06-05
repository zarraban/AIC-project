from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
import psycopg
from io import BytesIO
import datetime
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/pdf", tags=["PDF Export"])

@router.get("/receipt/{check_number}")
async def export_receipt_pdf(
    check_number: str,
    db: psycopg.AsyncConnection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT r.check_number, r.print_date, r.sum_total, r.vat,
                   e.empl_surname, e.empl_name, c.cust_surname, c.percent
            FROM receipt r
            JOIN employee e ON r.id_employee = e.id_employee
            LEFT JOIN customer_card c ON r.card_number = c.card_number
            WHERE r.check_number = %s
        """, (check_number,))
        receipt = await cursor.fetchone()
        if not receipt:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        
        await cursor.execute("""
            SELECT p.product_name, s.product_number, s.selling_price
            FROM sale s
            JOIN store_product sp ON s.UPC = sp.UPC
            JOIN product p ON sp.id_product = p.id_product
            WHERE s.check_number = %s
        """, (check_number,))
        sales = await cursor.fetchall()