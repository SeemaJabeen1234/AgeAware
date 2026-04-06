import os
import sys
import base64
import io
import uvicorn
import numpy as np
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from typing import Dict, Any, Optional

# Add parent directory to path to import from model
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from model.predict import AgeEstimator

app = FastAPI(title="Age-Aware AI API", description="API for age estimation using MobileNetV2")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the age estimator
age_estimator = AgeEstimator()
model_loaded = False

class ImageRequest(BaseModel):
    """Request body for image prediction"""
    image_base64: str
    detect_face: bool = True


@app.on_event("startup")
async def startup_event():
    """Load model when the app starts"""
    global model_loaded
    print("Starting Age Estimation API...")
    model_loaded = age_estimator.load_model()
    if model_loaded:
        print("Model loaded successfully at startup")
    else:
        print("WARNING: Model failed to load at startup")


@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Age-Aware AI API is running"}


@app.get("/model-status")
def get_model_status():
    """Check if the model is loaded and ready"""
    global model_loaded
    return {
        "model_loaded": model_loaded,
        "status": "ready" if model_loaded else "not_ready"
    }


@app.post("/predict-age")
def predict_age(request: ImageRequest):
    """
    Endpoint to predict age from an image
    
    Args:
        request: ImageRequest with base64 encoded image
        
    Returns:
        dict: Age prediction results
    """
    global model_loaded
    
    # Check if model is loaded
    if not model_loaded:
        # Try to load model if not loaded
        model_loaded = age_estimator.load_model()
        if not model_loaded:
            raise HTTPException(status_code=503, detail="Model not loaded. Please try again later.")
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # TODO: Add face detection if request.detect_face is True
        # For now, we'll assume the image is already a face
        
        # Predict age
        result = age_estimator.predict_age(img_array)
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))
        
        return {
            "age_group": result["age_group"],
            "confidence": result["confidence"],
            "predictions": result["predictions"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reload-model")
def reload_model():
    """Force reload the model"""
    global model_loaded
    model_loaded = age_estimator.load_model()
    return {"success": model_loaded}


if __name__ == "__main__":
    # Run the API server
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
