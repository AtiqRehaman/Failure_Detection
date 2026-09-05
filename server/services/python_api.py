#!/usr/bin/env python3
"""
Python API Server for ML/LangGraph Services
Runs in Docker container and exposes endpoints for Node.js backend
"""

import json
import os
import sys
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import LangGraph recommendation graph
from ml_model.recommendation_graph import build_recommendation_graph, generate_fallback_recommendations

# Import ML prediction
try:
    from ml_model.predict import load_models, predict_full
except ImportError:
    print("⚠️ ML prediction module not found, using fallback")
    load_models = None
    predict_full = None

ML_MODELS_LOADED = False

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Senken ML Service",
    description="Python ML/LangGraph Service for Senken",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_ml_models():
    """Load CatBoost models before accepting prediction requests."""
    global ML_MODELS_LOADED
    if load_models is not None:
        result = load_models()
        ML_MODELS_LOADED = result.get("success", False)
        if not ML_MODELS_LOADED:
            print(f"⚠️ ML models unavailable: {result.get('error', 'Unknown error')}")

# ============================================================
# PYDANTIC MODELS
# ============================================================

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

class RecommendationRequest(BaseModel):
    context: Dict[str, Any]
    provider: Optional[str] = "local"

class HealthResponse(BaseModel):
    status: str
    ml_available: bool
    langgraph_available: bool

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    return {
        "service": "Senken Python ML Service",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check",
            "/predict": "ML prediction",
            "/recommendations": "Generate recommendations",
            "/swot": "Generate SWOT analysis"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    ml_available = predict_full is not None and ML_MODELS_LOADED
    
    # Check if LangGraph can be built
    langgraph_available = False
    try:
        build_recommendation_graph()
        langgraph_available = True
    except:
        pass
    
    return HealthResponse(
        status="healthy",
        ml_available=ml_available,
        langgraph_available=langgraph_available
    )

@app.post("/predict")
async def predict(request: PredictionRequest):
    """Run ML prediction"""
    if predict_full is None or not ML_MODELS_LOADED:
        raise HTTPException(status_code=503, detail="ML prediction not available")
    
    try:
        result = predict_full(request.features)
        if result.get("success"):
            return {
                "status": "success",
                "data": result.get("data", {})
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Prediction failed"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendations")
async def generate_recommendations(request: RecommendationRequest):
    """Generate recommendations using LangGraph"""
    try:
        # Build the graph
        graph = build_recommendation_graph()
        
        # Prepare initial state
        initial_state = {
            'project_context': request.context,
            'recommendations': None,
            'validation_result': {'valid': False, 'issues': []},
            'refinement_attempt': 0,
            'llm_provider': request.provider or 'local',
            'final': False,
            'error': None,
            'raw_response': None
        }
        
        # Run the graph
        result = graph.invoke(initial_state)
        
        # Extract recommendations
        recs = result.get('recommendations')
        
        if recs:
            # Convert Pydantic model to dict if needed
            if hasattr(recs, 'model_dump'):
                recs = recs.model_dump()
            elif hasattr(recs, 'dict'):
                recs = recs.dict()
            
            return {
                "status": "success",
                "data": {
                    "summary": recs.get('summary', ''),
                    "recommendations": [
                        {
                            "title": r.get('title', ''),
                            "priority": r.get('priority', 'medium'),
                            "risk_addressed": r.get('risk_addressed', ''),
                            "reasoning": r.get('reasoning', ''),
                            "action": r.get('action', ''),
                            "expected_impact": r.get('expected_impact', '')
                        }
                        for r in recs.get('recommendations', [])
                    ],
                    "improvement_suggestions": [
                        {
                            "title": i.get('title', ''),
                            "reasoning": i.get('reasoning', ''),
                            "action": i.get('action', ''),
                            "expected_impact": i.get('expected_impact', '')
                        }
                        for i in recs.get('improvement_suggestions', [])
                    ],
                    "validation": result.get('validation_result', {'valid': False, 'issues': []}),
                    "llm_provider": result.get('llm_provider', 'local'),
                    "refined": result.get('refinement_attempt', 0) > 0
                }
            }
        else:
            # Fallback
            fallback = generate_fallback_recommendations(request.context)
            return {
                "status": "success",
                "data": {
                    "summary": fallback.summary,
                    "recommendations": [
                        {
                            "title": r.title,
                            "priority": r.priority,
                            "risk_addressed": r.risk_addressed,
                            "reasoning": r.reasoning,
                            "action": r.action,
                            "expected_impact": r.expected_impact
                        }
                        for r in fallback.recommendations
                    ],
                    "improvement_suggestions": [
                        {
                            "title": i.title,
                            "reasoning": i.reasoning,
                            "action": i.action,
                            "expected_impact": i.expected_impact
                        }
                        for i in fallback.improvement_suggestions
                    ],
                    "validation": {'valid': False, 'issues': ['Using fallback recommendations']},
                    "llm_provider": 'fallback',
                    "refined": False
                }
            }
            
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/swot")
async def generate_swot(request: RecommendationRequest):
    """Generate SWOT analysis using LLM"""
    # This would call your existing SWOT generation
    return {
        "status": "success",
        "data": {
            "message": "SWOT generation endpoint"
        }
    }

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)