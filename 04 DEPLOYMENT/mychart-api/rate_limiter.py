# File baru: rate_limiter.py
from fastapi import HTTPException, Depends
from auth import verify_token
from datetime import date

# Variabel untuk menyimpan data rate limit (akan reset jika API restart)
# Format: { "email_user": {"date": <tanggal>, "count": <jumlah>} }
user_request_counts = {}
DAILY_LIMIT_USER = 50 # Kuota harian untuk role 'user'

def rate_limiter(payload: dict = Depends(verify_token)):
    email = payload.get("sub")
    role = payload.get("role")

    # Admin tidak memiliki batasan
    if role == 'admin':
        return

    today = date.today()
    user_data = user_request_counts.get(email)

    # Jika user belum ada datanya atau sudah beda hari, reset counternya
    if not user_data or user_data["date"] != today:
        user_request_counts[email] = {"date": today, "count": 1}
        return

    # Jika kuota sudah habis, tolak permintaan
    if user_data["count"] >= DAILY_LIMIT_USER:
        raise HTTPException(
            status_code=429, # Too Many Requests
            detail=f"Kuota harian Anda ({DAILY_LIMIT_USER} request) telah habis."
        )

    # Jika kuota masih ada, tambahkan hitungan dan lanjutkan
    user_request_counts[email]["count"] += 1