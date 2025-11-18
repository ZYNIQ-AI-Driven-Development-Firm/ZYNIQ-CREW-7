"""
LLM Model Configuration for CrewAI
Supports Gemini (Orchestrator), aimalapi (Specialists), and Ollama (fallback)
"""
from __future__ import annotations

import os
from typing import Any

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.config import settings


def get_gemini_llm(**kwargs: Any):
    """
    Get Gemini model for Orchestrator role with fallback chain:
    1. Try Google Gemini API directly
    2. Try AimlAPI with Gemini models
    3. Fall back to Ollama
    
    Requires GEMINI_API_KEY or AIMALAPI_API_KEY env vars.
    """
    # Try direct Gemini API first
    if HAS_GEMINI:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
            temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
            max_tokens = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
            
            try:
                return ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=api_key,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                )
            except Exception as e:
                print(f"⚠️ Gemini API failed: {e}, trying AimlAPI...")
    
    # Try AimlAPI with Gemini models
    aimalapi_key = os.getenv("AIMALAPI_API_KEY")
    if aimalapi_key:
        base_url = os.getenv("AIMALAPI_BASE_URL", "https://api.aimalapi.com/v1")
        # AimlAPI supports gemini-1.5-flash, gemini-1.5-pro
        gemini_model = os.getenv("AIMAL_GEMINI_MODEL", "gemini-1.5-flash")
        temperature = float(os.getenv("AIMALAPI_TEMPERATURE", "0.7"))
        max_tokens = int(os.getenv("AIMALAPI_MAX_TOKENS", "2048"))
        
        try:
            return ChatOpenAI(
                model=gemini_model,
                openai_api_key=aimalapi_key,
                openai_api_base=base_url,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        except Exception as e:
            print(f"⚠️ AimlAPI with Gemini failed: {e}, falling back to Ollama...")
    
    # Final fallback to Ollama
    print("⚠️ No Gemini or AimlAPI available, using Ollama for orchestrator")
    return get_ollama_llm(**kwargs)


def get_aimalapi_llm(role: str = "general", **kwargs: Any) -> ChatOpenAI:
    """
    Get aimalapi model for specialist agents.
    Uses OpenAI-compatible API with aimalapi base URL.
    
    Args:
        role: Agent role (backend, frontend, qa, devops) for model selection
        **kwargs: Additional parameters for ChatOpenAI
    """
    api_key = os.getenv("AIMALAPI_API_KEY")
    if not api_key:
        raise ValueError(
            "AIMALAPI_API_KEY not found. Set it in environment for specialist models."
        )
    
    base_url = os.getenv("AIMALAPI_BASE_URL", "https://api.aimalapi.com/v1")
    
    # Role-specific model selection with fallback
    role_models = {
        "backend": os.getenv("AIMAL_BACKEND_MODEL", "gpt-4o-mini"),
        "frontend": os.getenv("AIMAL_FRONTEND_MODEL", "gpt-4o-mini"),
        "qa": os.getenv("AIMAL_QA_MODEL", "gpt-4o-mini"),
        "devops": os.getenv("AIMAL_DEVOPS_MODEL", "gpt-4o-mini"),
        "data": os.getenv("AIMAL_DATA_MODEL", "gpt-4o-mini"),
        "security": os.getenv("AIMAL_SECURITY_MODEL", "gpt-4o-mini"),
    }
    
    model_name = role_models.get(role, os.getenv("AIMALAPI_MODEL", "gpt-4o-mini"))
    temperature = float(os.getenv("AIMALAPI_TEMPERATURE", "0.7"))
    max_tokens = int(os.getenv("AIMALAPI_MAX_TOKENS", "2048"))
    
    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs
    )


def get_ollama_llm(model: str | None = None, **kwargs: Any) -> ChatOllama:
    """
    Get Ollama model for local development/testing.
    Falls back to Ollama if Gemini/aimalapi not configured.
    """
    model_name = model or settings.MODEL_GENERAL
    
    return ChatOllama(
        model=model_name,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.7,
        **kwargs
    )


def get_llm_for_agent(agent_role: str, use_gemini_orchestrator: bool = True) -> Any:
    """
    Get appropriate LLM based on agent role.
    
    Args:
        agent_role: Role of the agent (orchestrator, backend, frontend, etc.)
        use_gemini_orchestrator: If True, use Gemini for orchestrator, else use aimalapi
    
    Returns:
        Configured LLM instance
    """
    agent_role_lower = agent_role.lower()
    
    # Check if we have required API keys
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))
    has_aimalapi = bool(os.getenv("AIMALAPI_API_KEY"))
    
    # Orchestrator logic
    if "orchestrator" in agent_role_lower or "tech lead" in agent_role_lower:
        if use_gemini_orchestrator and has_gemini:
            return get_gemini_llm()
        elif has_aimalapi:
            return get_aimalapi_llm(role="general")
        else:
            # Fallback to Ollama
            return get_ollama_llm()
    
    # Specialist logic - prefer aimalapi, fallback to Ollama
    if has_aimalapi:
        # Map agent roles to aimalapi role keys
        role_mapping = {
            "backend": "backend",
            "frontend": "frontend",
            "qa": "qa",
            "test": "qa",
            "devops": "devops",
            "infra": "devops",
            "data": "data",
            "security": "security",
        }
        
        for keyword, aimal_role in role_mapping.items():
            if keyword in agent_role_lower:
                return get_aimalapi_llm(role=aimal_role)
        
        # Default specialist
        return get_aimalapi_llm(role="general")
    else:
        # Fallback to Ollama
        model = settings.MODEL_CODE if any(x in agent_role_lower for x in ["backend", "frontend", "code"]) else settings.MODEL_GENERAL
        return get_ollama_llm(model=model)
