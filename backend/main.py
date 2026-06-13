from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import psycopg
import uvicorn
import os
from dotenv import load_dotenv
import asyncio
from contextlib import asynccontextmanager
from database import get_db, get_db_connection
from routers import auth, categories, products, store_products, employees, \
                    customer_cards, receipts, reports, analytics

load_dotenv()

async def cleanup_old_receipts():
    while True:
        try:
            conn = await get_db_connection()
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM \"Receipt\" WHERE print_date < NOW() - INTERVAL '3 years';")
                await conn.commit()
            await conn.close()
            print("Cleanup: Old receipts deleted.")
        except Exception as e:
            print(f"Receipt cleanup error: {e}")
        
        await asyncio.sleep(86400)
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_old_receipts())
    yield
    task.cancel()

app = FastAPI(
    title="Zlagoda Supermarket API",
    description="Backend API for Zlagoda Supermarket",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(analytics.router, prefix="/api")

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