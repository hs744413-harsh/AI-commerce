"""
Grok (GROQ) LLM service — single client used by all AI routes.

GROQ's API is fully OpenAI-compatible. Set GROQ_API_KEY in backend/.env.
Model used: llama-3.3-70b-versatile  (fast, cost-effective for chat & search tasks).
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer

load_dotenv(Path(__file__).parent / ".env")

# ---------------------------------------------------------------------------
# Client — initialised once at import time.
# If GROQ_API_KEY is blank the client is created but calls will fail with
# an auth error; this lets the server boot even without the key set.
# ---------------------------------------------------------------------------
_client = AsyncOpenAI(
    api_key=os.environ.get("GROQ_API_KEY") or "dummy",
    base_url="https://api.groq.com/openai/v1",
)

GROK_MODEL = "llama-3.3-70b-versatile"

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


async def chat_completion(messages: list[dict], stream: bool = False, **kwargs):
    """
    Thin wrapper around the GROQ chat-completions endpoint.

    Args:
        messages: List of {"role": ..., "content": ...} dicts.
        stream:   If True, returns a streaming response object.
        **kwargs: Additional parameters forwarded to the API
                  (e.g. temperature, max_tokens).

    Returns:
        Non-streaming: the full ChatCompletion object.
        Streaming:     an async iterator of ChatCompletionChunk objects.
    """
    response = await _client.chat.completions.create(
        model=GROK_MODEL,
        messages=messages,
        stream=stream,
        **kwargs,
    )
    return response


async def embed_text(text: str):
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()