from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import psycopg
import uvicorn
import os
from dotenv import load_dotenv
from database import get_db
from routers import auth, categories, products, store_products, employees, \
                    customer_cards, receipts, reports, pdf_export

load_dotenv()

app = FastAPI(
    title="Zlagoda Supermarket API",
    description="Backend API for Zlagoda Supermarket",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(store_products.router)
app.include_router(employees.router)
app.include_router(customer_cards.router)
app.include_router(receipts.router)
app.include_router(reports.router)
app.include_router(pdf_export.router)

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")


@app.get("/health")
async def health_check(db: psycopg.AsyncConnection = Depends(get_db)):
    async with db.cursor() as cursor:
        await cursor.execute("SELECT 1 AS status;")
        result = await cursor.fetchone()
    return {"status": "ok", "db_status": result["status"]}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)