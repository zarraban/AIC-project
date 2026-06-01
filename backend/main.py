from fastapi import FastAPI, Depends, HTTPException
import psycopg
import uvicorn
import os
from dotenv import load_dotenv
from database import get_db

load_dotenv()

app = FastAPI(
    title="Zlagoda Supermarket API",
    description="Backend API for Zlagoda Supermarket using raw SQL (no ORM) with async psycopg3",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Zlagoda API"}

@app.get("/health")
async def health_check(db: psycopg.AsyncConnection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute("SELECT 1 AS status;")
            result = await cursor.fetchone()
        return {"status": "ok", "db_status": result['status']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv('PORT', 8000)))