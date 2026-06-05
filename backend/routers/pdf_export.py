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
        buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2 * cm, 26 * cm, "ZLAGODA SUPERMARKET")
    c.setFont("Helvetica", 12)
    c.drawString(2 * cm, 25 * cm, f"Check Number: {receipt['check_number']}")
    c.drawString(2 * cm, 24.3 * cm, f"Date: {receipt['print_date'].strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(2 * cm, 23.6 * cm, f"Cashier: {receipt['empl_name']} {receipt['empl_surname']}")
    if receipt['cust_surname']:
        c.drawString(2 * cm, 22.9 * cm, f"Customer: {receipt['cust_surname']} (Discount: {receipt['percent']}%)")
    c.line(2 * cm, 22 * cm, 19 * cm, 22 * cm)
    y = 21 * cm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2 * cm, y, "Product")
    c.drawString(12 * cm, y, "Qty")
    c.drawString(15 * cm, y, "Price")
    c.drawString(18 * cm, y, "Total")
    y -= 0.7 * cm
    c.setFont("Helvetica", 10)
    for sale in sales:
        total = float(sale['selling_price']) * sale['product_number']
        c.drawString(2 * cm, y, str(sale['product_name'])[:40])
        c.drawString(12 * cm, y, str(sale['product_number']))
        c.drawString(15 * cm, y, f"{float(sale['selling_price']):.2f}")
        c.drawString(18 * cm, y, f"{total:.2f}")
        y -= 0.6 * cm
    c.line(2 * cm, y, 19 * cm, y)
    y -= 0.7 * cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(12 * cm, y, f"VAT (20%): {float(receipt['vat']):.2f}")
    y -= 0.7 * cm
    c.drawString(12 * cm, y, f"TOTAL: {float(receipt['sum_total']):.2f}")
    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    headers = {
        'Content-Disposition': f'inline; filename="receipt_{check_number}.pdf"'
    }
    return Response(content=pdf, media_type="application/pdf", headers=headers)