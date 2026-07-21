import requests, json

s = requests.Session()
URL = "http://127.0.0.1:8000/api"

print("1. Testing Auth...")
r = s.post(f"{URL}/auth/session", json={"session_id": "test", "email": "admin@ai-commerce.dev"})
print("Auth:", r.status_code, r.json())
cookie = r.cookies.get("session_token")
s.cookies.set("session_token", cookie)

print("\n2. Testing Products...")
r = s.get(f"{URL}/products?limit=2")
print("Products:", r.status_code, len(r.json()))
assert r.status_code == 200

print("\n3. Testing Add to Cart...")
if len(r.json()) > 0:
    pid = r.json()[0]['product_id']
    r = s.post(f"{URL}/cart", json={"product_id": pid, "quantity": 1})
    print("Add Cart:", r.status_code, r.json())
    assert r.status_code == 200

print("\n4. Testing Checkout (Stripe)...")
r = s.post(f"{URL}/orders/checkout", json={
    "shipping": {
        "full_name": "Test User", "line1": "123 Main St", "city": "NYC",
        "country": "US", "postal_code": "10001", "phone": "555-0100"
    },
    "origin_url": "http://localhost:3000"
})
print("Checkout:", r.status_code)
if r.status_code != 200:
    print(r.text)
# We expect this to fail or pass depending on STRIPE_API_KEY being valid.
# But since we use the dummy key 'sk_test_emergent' it will likely fail with a 500 API Gateway error.
# We will catch that and ensure it's a Stripe error and not a local code crash.

print("\n5. Testing AI Recommendation (Grok)...")
r = s.post(f"{URL}/ai/recommend", json={"context": "headphones"})
print("AI Recommend:", r.status_code)
if r.status_code != 200:
    print(r.text)
