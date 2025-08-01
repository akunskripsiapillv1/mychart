from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from auth import auth_router
from api_routes import chart_router
from table_chart_routes import table_chart_router
from user_routes import user_router

app = FastAPI(title="Chart-to-Text API", description="API untuk ChartInstruct-Llama & UniChart", root_path="/mychart-api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan origin frontend kamu jika ingin lebih aman
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# === STATUS CHECK ===
@app.get("/")
def root():
    return {"message": "Welcome to Chart-to-Text API"}


# === HEALTH CHECK ===
@app.get("/health/")
def health():
    return {"message": "Chart-to-Text API is running!"}

# Register routers
app.include_router(auth_router, prefix="", tags=["Authentication"])
app.include_router(chart_router, prefix="", tags=["Chart-to-text"])
app.include_router(table_chart_router, prefix="/chart", tags=["Chart Generation"])
app.include_router(user_router, tags=["User"])