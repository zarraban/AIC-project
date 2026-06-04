from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import psycopg
from database import get_db
from auth import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: psycopg.AsyncConnection = Depends(get_db)
):
    async with db.cursor() as cursor:
        await cursor.execute(
            """SELECT ea.id_employee, ea.password_hash, e.empl_name, e.empl_surname, e.empl_role
               FROM "Employee_Auth" ea
               JOIN "Employee" e ON e.id_employee = ea.id_employee
               WHERE ea.login = %s""",
            (form_data.username,)
        )
        user = await cursor.fetchone()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний логін або пароль"
        )

    token = create_access_token({
        "sub": user["id_employee"],
        "role": user["empl_role"]
    })

    return {
        "token": token,
        "token_type": "bearer",
        "id": user["id_employee"],
        "name": user["empl_name"],
        "surname": user["empl_surname"],
        "role": user["empl_role"].lower()
    }
