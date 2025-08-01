# File baru: mychart-api/user_routes.py

from fastapi import APIRouter, Depends, HTTPException
from auth import verify_token
from datetime import date

# Impor variabel pelacak kuota dari rate_limiter.py
# Pastikan DAILY_LIMIT_USER di rate_limiter.py sesuai dengan yang Anda inginkan (misal: 50)
from rate_limiter import user_request_counts, DAILY_LIMIT_USER 

user_router = APIRouter()

@user_router.get("/user/quota", tags=["User"])
def get_user_quota(payload: dict = Depends(verify_token)):
    """
    Mengembalikan informasi kuota penggunaan API harian untuk pengguna yang terautentikasi.
    """
    email = payload.get("sub")
    role = payload.get("role")

    # Admin memiliki kuota tak terbatas
    if role == 'admin':
        return {"used": "NA", "limit": "Unlimited"}

    today = date.today()
    user_data = user_request_counts.get(email)

    # Jika pengguna belum membuat permintaan hari ini, kuota terpakai adalah 0
    if not user_data or user_data.get("date") != today:
        used_quota = 0
    else:
        used_quota = user_data.get("count", 0)

    return {"used": used_quota, "limit": DAILY_LIMIT_USER}