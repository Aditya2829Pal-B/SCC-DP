"""
NLP Service — Multilingual BERT Complaint Classification
FastAPI microservice for classifying citizen complaints into categories using Zero-Shot mDeBERTa.
Supports English, Hindi, Bengali, Tamil, Telugu, Marathi, Spanish, French, Arabic.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect
import torch
from transformers import pipeline
import time

app = FastAPI(title="SCC&DP Multilingual NLP Service", description="Enterprise Complaint Classification API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Request/Response Models ──
class ClassifyRequest(BaseModel):
    text: str

class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    language: str
    all_probabilities: dict

# ── Global Model Loader ──
classifier = None
device = 0 if torch.cuda.is_available() else -1
# Using mDeBERTa-v3 for native multilingual zero-shot classification without needing translation
MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"

CATEGORIES = [
    "Road Damage",
    "Water Supply",
    "Electricity",
    "Garbage",
    "Flooding",
    "Street Light",
    "Noise Pollution",
    "Sewage",
    "Other"
]

@app.on_event("startup")
async def startup():
    global classifier
    print(f"[INIT] Loading Multilingual BERT Model: {MODEL_NAME}...")
    start_time = time.time()
    try:
        classifier = pipeline("zero-shot-classification", model=MODEL_NAME, device=device)
        print(f"[READY] Model loaded successfully in {time.time() - start_time:.2f} seconds.")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        # Fallback will be handled in the endpoint if classifier is None

@app.post("/classify", response_model=ClassifyResponse)
async def classify_complaint(request: ClassifyRequest):
    """Classify a multilingual complaint text into a category"""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Detect Language
    try:
        lang = detect(text)
    except:
        lang = "unknown"

    if classifier is None:
        # Graceful fallback if model failed to load (e.g., due to memory constraints)
        return ClassifyResponse(
            category="Other",
            confidence=0.5,
            language=lang,
            all_probabilities={}
        )

    # Perform Zero-Shot Classification
    try:
        result = classifier(text, CATEGORIES, multi_label=False)
        
        # Result format: {'sequence': text, 'labels': ['Electricity', 'Water...'], 'scores': [0.9, 0.05...]}
        best_category = result['labels'][0]
        confidence = round(float(result['scores'][0]), 4)
        
        all_probs = {label: round(float(score), 4) for label, score in zip(result['labels'], result['scores'])}

        return ClassifyResponse(
            category=best_category,
            confidence=confidence,
            language=lang,
            all_probabilities=all_probs
        )
    except Exception as e:
        print(f"[ERROR] Classification failed: {e}")
        raise HTTPException(status_code=500, detail="Internal ML processing error")

@app.get("/health")
async def health():
    return {
        "status": "OK",
        "service": "Multilingual BERT NLP",
        "model_loaded": classifier is not None,
        "device": "GPU" if device == 0 else "CPU",
        "supported_categories": CATEGORIES
    }

@app.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}
