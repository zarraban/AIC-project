import psycopg
from psycopg.rows import dict_row
from config import settings
from typing import AsyncGenerator
from fastapi import HTTPException
async def get_db_connection() -> psycopg.AsyncConnection:
    try:
        conn = await psycopg.AsyncConnection.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASS,
            dbname=settings.DB_NAME,
            row_factory=dict_row
        )
        return conn
    except psycopg.Error as e:
        print(f"Error connecting to database: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")
    
async def get_db() -> AsyncGenerator[psycopg.AsyncConnection, None]:
    conn = await get_db_connection()
    try:
        yield conn
    finally:
        await conn.close()