from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from auth import verify_token
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from pydantic import BaseModel
import models_loader
import requests
from rate_limiter import rate_limiter

# Load model saat server start
model_chartinstruct, processor_chartinstruct = models_loader.load_chartinstruct_model()
model_unichart, processor_unichart = models_loader.load_unichart_model()

chart_router = APIRouter()

class ImageURLRequest(BaseModel):
    image_url: str

# === CHARTINSTRUCT ENDPOINTS ===

@chart_router.post("/chartinstruct/upload")
async def describe_chartinstruct_upload(
    file: UploadFile = File(...),
    username: str = Depends(verify_token),
    limit: None = Depends(rate_limiter)
    ):
    try:
        image_data = await file.read()
        image = Image.open(BytesIO(image_data)).convert("RGB")
        prompt = "<image>\nBuatkan deskripsi dari grafik berikut ini secara lengkap dan informatif\nAnswer:"
        description = models_loader.generate_chartinstruct(model_chartinstruct, processor_chartinstruct, image, prompt)

        return JSONResponse(content={
            "description": description,
            "used_model": "chartinstruct",
            "source": "upload"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@chart_router.post("/chartinstruct/url")
async def describe_chartinstruct_url(
    request: ImageURLRequest,
    username: str = Depends(verify_token),
    limit: None = Depends(rate_limiter)):
    try:
        response = requests.get(request.image_url, stream=True)
        response.raise_for_status()

        image_data = BytesIO()
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                image_data.write(chunk)
        image_data.seek(0)

        image = Image.open(image_data).convert("RGB")

        prompt = "<image>\nBuatkan deskripsi dari grafik berikut ini secara lengkap dan informatif\nAnswer:"
        description = models_loader.generate_chartinstruct(model_chartinstruct, processor_chartinstruct, image, prompt)

        return JSONResponse(content={
            "description": description,
            "used_model": "chartinstruct",
            "source": "url"
        })

    except requests.exceptions.RequestException as re:
        raise HTTPException(status_code=500, detail=f"Download error: {str(re)}")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Gagal membuka gambar — mungkin bukan file gambar yang valid.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === UNICHART ENDPOINTS ===

@chart_router.post("/unichart/upload")
async def describe_unichart_upload(
    file: UploadFile = File(...),
    username: str = Depends(verify_token),
    limit: None = Depends(rate_limiter)):
    try:
        image_data = await file.read()
        image = Image.open(BytesIO(image_data)).convert("RGB")
        prompt = "<opencqa> Buatkan deskripsi dari grafik berikut ini secara lengkap dan informatif <s_answer>"
        description = models_loader.generate_unichart(model_unichart, processor_unichart, image, prompt)

        return JSONResponse(content={
            "description": description,
            "used_model": "unichart",
            "source": "upload"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@chart_router.post("/unichart/url")
async def describe_unichart_url(
    request: ImageURLRequest,
    username: str = Depends(verify_token),
    limit: None = Depends(rate_limiter)):
    try:
        response = requests.get(request.image_url, stream=True)
        response.raise_for_status()

        image_data = BytesIO()
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                image_data.write(chunk)
        image_data.seek(0)

        image = Image.open(image_data).convert("RGB")

        prompt = "<opencqa> Buatkan deskripsi dari grafik berikut ini secara lengkap dan informatif <s_answer>"
        description = models_loader.generate_unichart(model_unichart, processor_unichart, image, prompt)

        return JSONResponse(content={
            "description": description,
            "used_model": "unichart",
            "source": "url",
            "image_url": request.image_url
        })
    except requests.exceptions.RequestException as re:
        raise HTTPException(status_code=500, detail=f"Download error: {str(re)}")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Gagal membuka gambar — mungkin bukan file gambar yang valid.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))