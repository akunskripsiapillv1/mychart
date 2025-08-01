# auth.py (Versi Baru dengan Supabase)
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Koneksi ke Supabase
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

SECRET_KEY = os.environ.get("SECRET_KEY") # Pastikan ini ada di .env Anda
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/mychart-api/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@auth_router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        # 1. Autentikasi ke Supabase
        user_session = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })
        user_id = user_session.user.id

        # 2. Ambil role dari tabel 'profiles'
        profile = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
        user_role = profile.data.get('role', 'user')

        # 3. Buat token JWT yang berisi email dan role
        access_token = create_access_token(
            data={"sub": form_data.username, "role": user_role}
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

def verify_token(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Sekarang kita kembalikan seluruh payload (termasuk role)
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")