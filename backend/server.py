from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid, logging, httpx, asyncio, stripe
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from llm import chat_completion, embed_text   # our helper


def _parse_cors_origins() -> List[str]:
    """Parse CORS_ORIGINS; never return '*' when credentials are enabled."""
    default = ["http://localhost:3000", "http://127.0.0.1:3000"]
    raw = os.getenv("CORS_ORIGINS", ",".join(default))
    origins: List[str] = []
    for origin in raw.split(","):
        cleaned = origin.strip().strip('"').strip("'")
        if cleaned and cleaned != "*":
            origins.append(cleaned)
    return origins or default


def _cookie_settings() -> dict:
    """Use HTTP-safe cookies for local development origins."""
    local_hosts = ("localhost", "127.0.0.1")
    is_local = all(any(host in origin for host in local_hosts) for origin in _parse_cors_origins())
    if is_local:
        return {"secure": False, "samesite": "lax"}
    return {"secure": True, "samesite": "none"}


CORS_ORIGINS = _parse_cors_origins()
COOKIE_SETTINGS = _cookie_settings()

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
XAI_API_KEY = os.environ.get('XAI_API_KEY', '')
XAI_MODEL = os.environ.get('XAI_MODEL', 'grok-1')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]

stripe.api_key = STRIPE_API_KEY

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="AI-Commerce API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-commerce")


# ---------- Utils ----------
def now_utc():
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.isoformat()

async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now_utc():
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> dict:
    user = await require_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------- Models ----------
class Product(BaseModel):
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    price: float
    category: str
    brand: str
    image_url: str
    stock: int = 100
    rating: float = 0.0
    review_count: int = 0
    created_at: str = Field(default_factory=lambda: iso(now_utc()))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    brand: str
    image_url: str
    stock: int = 100

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Review(BaseModel):
    review_id: str = Field(default_factory=lambda: f"rev_{uuid.uuid4().hex[:10]}")
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str = Field(default_factory=lambda: iso(now_utc()))

class ReviewCreate(BaseModel):
    rating: int
    comment: str

class ShippingAddress(BaseModel):
    full_name: str
    line1: str
    city: str
    country: str
    postal_code: str
    phone: str

class OrderCreate(BaseModel):
    shipping: ShippingAddress
    origin_url: str

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class RecommendIn(BaseModel):
    context: Optional[str] = None

class SearchIn(BaseModel):
    query: str

class CompareIn(BaseModel):
    product_ids: List[str]

class SummarizeIn(BaseModel):
    product_id: str


# ---------- Auth ----------
@api.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient(timeout=15.0) as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = (data.get("email") or "").lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        role = existing.get("role", "user")
        # promote to admin if email in list
        if email in ADMIN_EMAILS and role != "admin":
            role = "admin"
            await db.users.update_one({"user_id": user_id}, {"$set": {"role": "admin"}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if email in ADMIN_EMAILS else "user"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture", ""), "role": role,
            "created_at": iso(now_utc()),
        })
    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": data["session_token"],
        "expires_at": iso(expires_at), "created_at": iso(now_utc()),
    })
    response.set_cookie(
        key="session_token", value=data["session_token"],
        httponly=True, path="/", max_age=7*24*60*60,
        **COOKIE_SETTINGS,
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user}

@api.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------- Products ----------
@api.get("/products")
async def list_products(
    q: Optional[str] = None, category: Optional[str] = None,
    brand: Optional[str] = None, min_price: Optional[float] = None,
    max_price: Optional[float] = None, limit: int = 60,
):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}},
        ]
    if category: query["category"] = category
    if brand: query["brand"] = brand
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None: price_q["$gte"] = min_price
        if max_price is not None: price_q["$lte"] = max_price
        query["price"] = price_q
    items = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return items

@api.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@api.post("/products")
async def create_product(payload: ProductCreate, request: Request):
    await require_admin(request)
    prod = Product(**payload.model_dump())
    await db.products.insert_one(prod.model_dump())
    return prod.model_dump()

@api.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductCreate, request: Request):
    await require_admin(request)
    r = await db.products.update_one({"product_id": product_id}, {"$set": payload.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"product_id": product_id}, {"_id": 0})

@api.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await require_admin(request)
    r = await db.products.delete_one({"product_id": product_id})
    return {"deleted": r.deleted_count}

@api.get("/categories")
async def categories():
    cats = await db.products.distinct("category")
    brands = await db.products.distinct("brand")
    return {"categories": sorted([c for c in cats if c]), "brands": sorted([b for b in brands if b])}


# ---------- Reviews ----------
@api.get("/products/{product_id}/reviews")
async def list_reviews(product_id: str):
    revs = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(200)
    return revs

@api.post("/products/{product_id}/reviews")
async def add_review(product_id: str, payload: ReviewCreate, request: Request):
    user = await require_user(request)
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    rev = Review(
        product_id=product_id, user_id=user["user_id"],
        user_name=user["name"], rating=payload.rating, comment=payload.comment,
    )
    await db.reviews.insert_one(rev.model_dump())
    # update aggregate
    all_revs = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    avg = sum(r["rating"] for r in all_revs) / len(all_revs)
    await db.products.update_one(
        {"product_id": product_id},
        {"$set": {"rating": round(avg, 2), "review_count": len(all_revs)}},
    )
    return rev.model_dump()


# ---------- Cart ----------
@api.get("/cart")
async def get_cart(request: Request):
    user = await require_user(request)
    items = await db.cart.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    products = {}
    if items:
        pids = [i["product_id"] for i in items]
        for p in await db.products.find({"product_id": {"$in": pids}}, {"_id": 0}).to_list(200):
            products[p["product_id"]] = p
    enriched = []
    subtotal = 0.0
    for i in items:
        p = products.get(i["product_id"])
        if not p: continue
        line = p["price"] * i["quantity"]
        subtotal += line
        enriched.append({**i, "product": p, "line_total": round(line, 2)})
    return {"items": enriched, "subtotal": round(subtotal, 2), "count": sum(i["quantity"] for i in items)}

@api.post("/cart")
async def add_to_cart(item: CartItem, request: Request):
    user = await require_user(request)
    existing = await db.cart.find_one({"user_id": user["user_id"], "product_id": item.product_id})
    if existing:
        await db.cart.update_one(
            {"user_id": user["user_id"], "product_id": item.product_id},
            {"$inc": {"quantity": item.quantity}},
        )
    else:
        await db.cart.insert_one({
            "user_id": user["user_id"], "product_id": item.product_id,
            "quantity": item.quantity, "added_at": iso(now_utc()),
        })
    return {"ok": True}

@api.patch("/cart/{product_id}")
async def update_cart(product_id: str, item: CartItem, request: Request):
    user = await require_user(request)
    if item.quantity <= 0:
        await db.cart.delete_one({"user_id": user["user_id"], "product_id": product_id})
    else:
        await db.cart.update_one(
            {"user_id": user["user_id"], "product_id": product_id},
            {"$set": {"quantity": item.quantity}},
        )
    return {"ok": True}

@api.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    user = await require_user(request)
    await db.cart.delete_one({"user_id": user["user_id"], "product_id": product_id})
    return {"ok": True}


# ---------- Orders + Stripe ----------
@api.post("/orders/checkout")
async def create_checkout(payload: OrderCreate, request: Request):
    user = await require_user(request)
    cart_items = await db.cart.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    pids = [i["product_id"] for i in cart_items]
    products = {p["product_id"]: p for p in await db.products.find(
        {"product_id": {"$in": pids}}, {"_id": 0}).to_list(200)}
    total = 0.0
    order_items = []
    for i in cart_items:
        p = products.get(i["product_id"])
        if not p: continue
        line = p["price"] * i["quantity"]
        total += line
        order_items.append({
            "product_id": p["product_id"], "name": p["name"], "price": p["price"],
            "quantity": i["quantity"], "image_url": p["image_url"],
        })
    total = round(total, 2)
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id, "user_id": user["user_id"], "items": order_items,
        "subtotal": total, "shipping": payload.shipping.model_dump(),
        "status": "pending_payment", "payment_status": "initiated",
        "created_at": iso(now_utc()),
    }
    await db.orders.insert_one(order_doc)

    host_url = payload.origin_url.rstrip("/")
    success_url = f"{host_url}/order/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/cart"

    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"Order {order_id}"},
                    "unit_amount": int(total * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": order_id, "user_id": user["user_id"]},
        )
    except Exception as e:
        logger.error(f"Stripe session creation error: {e}")
        raise HTTPException(status_code=500, detail="Payment provider error")

    await db.payment_transactions.insert_one({
        "session_id": session.id, "order_id": order_id,
        "user_id": user["user_id"], "amount": total, "currency": "usd",
        "payment_status": "initiated", "created_at": iso(now_utc()),
    })
    await db.orders.update_one({"order_id": order_id}, {"$set": {"stripe_session_id": session.id}})
    return {"url": session.url, "session_id": session.id, "order_id": order_id}

@api.get("/orders/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    user = await require_user(request)
    try:
        session = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe retrieve error: {e}")
        raise HTTPException(status_code=404, detail="Session not found")

    status = session.status
    payment_status = session.payment_status
    amount_total = session.amount_total / 100 if session.amount_total else None
    currency = session.currency
    metadata = session.metadata

    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if tx and tx.get("payment_status") != payment_status:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status, "status": status}},
        )
        if payment_status == "paid":
            order_id = tx.get("order_id")
            if order_id:
                order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
                if order and order.get("payment_status") != "paid":
                    await db.orders.update_one(
                        {"order_id": order_id},
                        {"$set": {"payment_status": "paid", "status": "confirmed", "paid_at": iso(now_utc())}},
                    )
                    await db.cart.delete_many({"user_id": user["user_id"]})
    return {
        "status": status, "payment_status": payment_status,
        "amount_total": amount_total, "currency": currency,
        "metadata": metadata,
    }

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook secret not configured")
        return {"ok": False}
    try:
        event = stripe.Webhook.construct_event(
            payload=body, sig_header=sig, secret=STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return {"ok": False}
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return {"ok": False}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        payment_status = session.get("payment_status")
        if payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}},
                )
                order_id = tx.get("order_id")
                if order_id:
                    await db.orders.update_one(
                        {"order_id": order_id},
                        {"$set": {"payment_status": "paid", "status": "confirmed", "paid_at": iso(now_utc())}},
                    )
                    await db.cart.delete_many({"user_id": tx["user_id"]})
    return {"ok": True}

@api.get("/orders")
async def list_orders(request: Request):
    user = await require_user(request)
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await require_user(request)
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ---------- Admin ----------
@api.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    prod_count = await db.products.count_documents({})
    order_count = await db.orders.count_documents({})
    user_count = await db.users.count_documents({})
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    revenue = sum(o.get("subtotal", 0) for o in paid_orders)
    return {
        "products": prod_count, "orders": order_count, "users": user_count,
        "revenue": round(revenue, 2), "paid_orders": len(paid_orders),
    }

@api.get("/admin/orders")
async def admin_orders(request: Request):
    await require_admin(request)
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, body: dict, request: Request):
    await require_admin(request)
    allowed = {k: v for k, v in body.items() if k in {"status", "tracking_number"}}
    await db.orders.update_one({"order_id": order_id}, {"$set": allowed})
    return await db.orders.find_one({"order_id": order_id}, {"_id": 0})

@api.get("/admin/users")
async def admin_users(request: Request):
    await require_admin(request)
    return await db.users.find({}, {"_id": 0}).to_list(500)


# ---------- AI ----------
AI_SYSTEM_ASSISTANT = (
    "You are the AI Shopping Assistant for AI-Commerce, a stark, editorial e-commerce boutique. "
    "You are helpful, concise, and stylish. Recommend products from the catalog when relevant. "
    "Never make up prices. If the user asks about products, refer to what's shown in the catalog context."
)

async def _catalog_summary() -> str:
    prods = await db.products.find({}, {"_id": 0}).limit(30).to_list(30)
    lines = [
        f"- {p['name']} ({p['category']}, {p['brand']}) — ${p['price']}: {p['description'][:100]}"
        for p in prods
    ]
    return "Current catalog snapshot:\n" + "\n".join(lines)

@api.post("/ai/chat")
async def ai_chat(payload: ChatIn, request: Request):
    user = await get_current_user(request)
    sid = payload.session_id or f"chat_{uuid.uuid4().hex[:10]}"
    catalog = await _catalog_summary()
    system = AI_SYSTEM_ASSISTANT + "\n" + catalog

    # Persist user message
    if user:
        await db.chat_messages.insert_one({
            "session_id": sid, "user_id": user["user_id"], "role": "user",
            "content": payload.message, "created_at": iso(now_utc()),
        })

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": payload.message}
    ]

    async def gen():
        full = ""
        try:
            stream = await chat_completion(messages=messages, stream=True)
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    content = delta.content
                    full += content
                    yield f"data: {content}\n\n"
            # After stream ends
            if user and full:
                await db.chat_messages.insert_one({
                    "session_id": sid, "user_id": user["user_id"], "role": "assistant",
                    "content": full, "created_at": iso(now_utc()),
                })
            yield f"event: done\ndata: {sid}\n\n"
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(
        gen(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@api.post("/ai/semantic-search")
async def ai_semantic_search(payload: SearchIn):
    prods = await db.products.find({}, {"_id": 0}).limit(60).to_list(60)
    catalog_lines = [
        f"[{p['product_id']}] {p['name']} — {p['category']} / {p['brand']} — ${p['price']} — {p['description']}"
        for p in prods
    ]
    system = (
        "You are a semantic search engine for an e-commerce catalog. "
        "Given a natural-language query, return ONLY a comma-separated list of the 6 most relevant product_ids "
        "in ranked order. No commentary, no prose, just IDs like: prod_abc,prod_def"
    )
    messages = [
        {"role": "system", "content": system + "\nCatalog:\n" + "\n".join(catalog_lines)},
        {"role": "user", "content": f"Query: {payload.query}"}
    ]
    response = await chat_completion(messages=messages, stream=False)
    reply_text = response.choices[0].message.content
    ids = [x.strip() for x in reply_text.replace("\n", ",").split(",") if x.strip().startswith("prod_")]
    prod_map = {p["product_id"]: p for p in prods}
    results = [prod_map[i] for i in ids if i in prod_map][:6]
    return {"results": results, "reasoning": reply_text.strip()}

@api.post("/ai/recommend")
async def ai_recommend(payload: RecommendIn, request: Request):
    user = await get_current_user(request)
    context = payload.context or ""
    if user:
        orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).limit(5).to_list(5)
        history = ", ".join(sum([[i["name"] for i in o.get("items", [])] for o in orders], []))
        context += f"\nUser recent orders: {history}"
    prods = await db.products.find({}, {"_id": 0}).limit(40).to_list(40)
    lines = [f"[{p['product_id']}] {p['name']} — {p['category']} — ${p['price']}" for p in prods]
    system = (
        "You are a personal shopper. Recommend 4 products the user will love. "
        "Return ONLY a comma-separated list of product_ids. No prose."
    )
    messages = [
        {"role": "system", "content": system + "\nCatalog:\n" + "\n".join(lines)},
        {"role": "user", "content": f"Context: {context or 'general homepage'}"}
    ]
    response = await chat_completion(messages=messages, stream=False)
    text = response.choices[0].message.content
    ids = [x.strip() for x in text.replace("\n", ",").split(",") if x.strip().startswith("prod_")]
    pm = {p["product_id"]: p for p in prods}
    return {"results": [pm[i] for i in ids if i in pm][:4]}

@api.post("/ai/compare")
async def ai_compare(payload: CompareIn):
    prods = await db.products.find({"product_id": {"$in": payload.product_ids}}, {"_id": 0}).to_list(10)
    if len(prods) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 products")
    ctx = "\n\n".join([
        f"Product: {p['name']}\nBrand: {p['brand']}\nCategory: {p['category']}\nPrice: ${p['price']}\nRating: {p['rating']}\nDescription: {p['description']}"
        for p in prods
    ])
    system = (
        "You are a product comparison expert. Compare the given products in a clear, structured way. "
        "Use short paragraphs. Mention pros, cons, and who each is best for. Keep it under 250 words."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": ctx}
    ]
    response = await chat_completion(messages=messages, stream=False)
    text = response.choices[0].message.content
    return {"comparison": text.strip(), "products": prods}

@api.post("/ai/summarize-reviews")
async def ai_summarize_reviews(payload: SummarizeIn):
    revs = await db.reviews.find({"product_id": payload.product_id}, {"_id": 0}).to_list(200)
    if not revs:
        return {"summary": "No reviews yet for this product."}
    joined = "\n".join([f"[{r['rating']}★] {r['comment']}" for r in revs])
    system = (
        "You summarize product reviews. In 3 short bullet points, capture: 1) what people love, "
        "2) common complaints, 3) overall sentiment. Be concise and honest."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": joined}
    ]
    response = await chat_completion(messages=messages, stream=False)
    text = response.choices[0].message.content
    return {"summary": text.strip(), "count": len(revs)}


# ---------- Mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()