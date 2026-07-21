"""Seed AI-Commerce database with sample products and a demo admin user."""
import asyncio, os, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

def now(): return datetime.now(timezone.utc).isoformat()

PRODUCTS = [
    {"name": "Aether Wireless Headphones", "brand": "Sonos Lab", "category": "Audio", "price": 349.00,
     "description": "Precision-engineered over-ear headphones with adaptive noise cancellation and 40-hour battery life.",
     "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"},
    {"name": "Monolith Studio Speaker", "brand": "Sonos Lab", "category": "Audio", "price": 599.00,
     "description": "Solid oak monolith speaker. Room-filling sound, hand-tuned in Copenhagen.",
     "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80"},
    {"name": "Chrono Field Watch", "brand": "Ordinal", "category": "Watches", "price": 289.00,
     "description": "Sapphire crystal, brushed titanium case, glow-index at 3, 6, 9, 12. Water resistant to 200m.",
     "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80"},
    {"name": "Meridian Automatic", "brand": "Ordinal", "category": "Watches", "price": 1290.00,
     "description": "Swiss automatic movement, exhibition caseback. Understated luxury.",
     "image_url": "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80"},
    {"name": "Void Sneakers", "brand": "Kern", "category": "Footwear", "price": 220.00,
     "description": "All-black minimalist sneakers. Italian leather, rubber sole. Made in Portugal.",
     "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"},
    {"name": "Terra Runners", "brand": "Kern", "category": "Footwear", "price": 165.00,
     "description": "Trail-ready running shoes with recycled mesh and lugged sole for grip.",
     "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"},
    {"name": "Basalt Backpack", "brand": "Fjord", "category": "Bags", "price": 189.00,
     "description": "Waxed canvas everyday backpack. Padded laptop sleeve, magnetic closures.",
     "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"},
    {"name": "Slate Duffel", "brand": "Fjord", "category": "Bags", "price": 245.00,
     "description": "Weekend travel duffel. Cold-forged brass hardware. Lifetime warranty.",
     "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"},
    {"name": "Prisma Desk Lamp", "brand": "Haus", "category": "Home", "price": 145.00,
     "description": "Sculptural aluminum task lamp, dimmable warm-to-cool LED. Precision joints.",
     "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80"},
    {"name": "Volume Armchair", "brand": "Haus", "category": "Home", "price": 890.00,
     "description": "Bouclé lounge chair with steel base. Curated for reading rooms and quiet corners.",
     "image_url": "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80"},
    {"name": "Grit Ceramic Mug", "brand": "Haus", "category": "Home", "price": 32.00,
     "description": "Hand-thrown stoneware mug. Charcoal glaze. Sold as a pair.",
     "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80"},
    {"name": "Vector Sunglasses", "brand": "Optik", "category": "Eyewear", "price": 210.00,
     "description": "Acetate frame, polarized lenses. Angular silhouette, unisex.",
     "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"},
    {"name": "Line Reading Glasses", "brand": "Optik", "category": "Eyewear", "price": 120.00,
     "description": "Feather-light titanium frames with anti-glare coating.",
     "image_url": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80"},
    {"name": "Onyx Fountain Pen", "brand": "Nib", "category": "Stationery", "price": 320.00,
     "description": "Precision 14k gold nib. Piston-filled. A companion for a lifetime of notes.",
     "image_url": "https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800&q=80"},
    {"name": "Grain Notebook Set", "brand": "Nib", "category": "Stationery", "price": 48.00,
     "description": "Three linen-bound notebooks. Dot grid, ruled, blank. FSC certified paper.",
     "image_url": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80"},
    {"name": "Halo Smart Ring", "brand": "Vitals", "category": "Wearables", "price": 299.00,
     "description": "Titanium sleep and activity tracker. 7-day battery. No monthly fee.",
     "image_url": "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=800&q=80"},
    {"name": "Pulse Fitness Watch", "brand": "Vitals", "category": "Wearables", "price": 379.00,
     "description": "GPS, heart rate, VO2 max estimation. AMOLED always-on display.",
     "image_url": "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80"},
    {"name": "Studio Mirrorless Camera", "brand": "Aperture", "category": "Cameras", "price": 1499.00,
     "description": "Full-frame 33MP sensor. 5-axis stabilization. Built for creators.",
     "image_url": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80"},
    {"name": "Field 35mm Prime Lens", "brand": "Aperture", "category": "Cameras", "price": 649.00,
     "description": "f/1.4 sharpness edge-to-edge. Weather-sealed metal barrel.",
     "image_url": "https://images.unsplash.com/photo-1606986628253-b60a3d02fa9d?w=800&q=80"},
    {"name": "Node Espresso Maker", "brand": "Grind", "category": "Kitchen", "price": 749.00,
     "description": "Dual-boiler manual espresso machine. PID temperature control.",
     "image_url": "https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=800&q=80"},
]

async def main():
    await db.products.delete_many({})
    await db.reviews.delete_many({})
    docs = []
    for p in PRODUCTS:
        docs.append({
            **p,
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "stock": 50,
            "rating": 0.0,
            "review_count": 0,
            "created_at": now(),
        })
    await db.products.insert_many(docs)
    print(f"Seeded {len(docs)} products.")

    # Seed a couple of reviews for the first product
    p0 = docs[0]
    demo_reviews = [
        (5, "Sound is spectacular. Comfortable for hours."),
        (4, "Great, but a bit pricey. Worth it if you care about audio."),
        (5, "Design is beautiful. Battery lasts forever."),
    ]
    for r, c in demo_reviews:
        await db.reviews.insert_one({
            "review_id": f"rev_{uuid.uuid4().hex[:10]}",
            "product_id": p0["product_id"],
            "user_id": "seed_user",
            "user_name": "Verified Buyer",
            "rating": r, "comment": c, "created_at": now(),
        })
    await db.products.update_one({"product_id": p0["product_id"]},
        {"$set": {"rating": 4.67, "review_count": 3}})

    # Demo admin user (OAuth login will match by email)
    await db.users.delete_many({"email": "admin@ai-commerce.dev"})
    await db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": "admin@ai-commerce.dev",
        "name": "Demo Admin",
        "picture": "",
        "role": "admin",
        "created_at": now(),
    })
    print("Seeded demo admin user (admin@ai-commerce.dev).")

if __name__ == "__main__":
    asyncio.run(main())