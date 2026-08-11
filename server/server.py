
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import json
import sys
import os
import time

app = FastAPI(title="Qwen2.5 GGUF Model API", description="API for Qwen2.5-7B-Instruct GGUF model")

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 0.95
    stop: Optional[List[str]] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 0.95

# Global model reference
llm = None

@app.get("/")
async def root():
    return {
        "message": "Qwen2.5 GGUF Model API is running!",
        "model": "Qwen2.5-7B-Instruct-Q4_K_M",
        "status": "healthy",
        "endpoints": {
            "/generate": "POST - Generate text from prompt",
            "/chat": "POST - Chat with model",
            "/health": "GET - Health check"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": llm is not None,
        "model_name": "Qwen2.5-7B-Instruct-Q4_K_M"
    }

@app.post("/generate")
async def generate(request: GenerateRequest):
    """Generate text from a prompt"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Build messages with system prompt if provided
        messages = []
        if request.system_prompt:
            messages.append({
                "role": "system",
                "content": request.system_prompt
            })
        messages.append({
            "role": "user",
            "content": request.prompt
        })

        # Generate using chat completion
        output = llm.create_chat_completion(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stop=request.stop,
            stream=False
        )

        response_text = output["choices"][0]["message"]["content"]

        return {
            "response": response_text,
            "usage": output.get("usage", {}),
            "model": "Qwen2.5-7B-Instruct-Q4_K_M"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat with the model"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Format messages
        messages = []
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Generate
        output = llm.create_chat_completion(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stream=False
        )

        response_text = output["choices"][0]["message"]["content"]

        return {
            "response": response_text,
            "usage": output.get("usage", {}),
            "model": "Qwen2.5-7B-Instruct-Q4_K_M"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Set the model reference
def set_model(model):
    global llm
    llm = model
    print("✅ Model set in API server")
