<div align="center">

# 🛒 AI-Commerce

### 🤖 AI-Powered E-Commerce Platform using React, FastAPI & LLM

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi"/>
<img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb"/>
<img src="https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge"/>
<img src="https://img.shields.io/badge/HuggingFace-Embeddings-yellow?style=for-the-badge"/>
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>

---

### 🚀 Intelligent Shopping Experience Powered by Generative AI

</div>

---

# 📖 Overview

AI-Commerce is a modern AI-powered e-commerce platform that combines a full-stack shopping application with Large Language Models (LLMs) to deliver an intelligent shopping experience.

Unlike traditional online stores, AI-Commerce enables users to search for products using natural language, receive AI-powered recommendations, interact with an intelligent shopping assistant, and enjoy a smooth end-to-end purchasing workflow.

---

# ✨ Features

## 🛍️ E-Commerce

- User Authentication
- Product Listing
- Product Details
- Shopping Cart
- Checkout System
- Order Management
- Responsive UI

---

## 🤖 AI Features

- AI Shopping Assistant
- Natural Language Product Search
- Semantic Search using Embeddings
- LLM-powered Chat
- Smart Product Recommendations
- Context-aware Conversations

---

## ⚡ Backend Features

- FastAPI REST APIs
- MongoDB Database
- JWT Authentication
- CORS Support
- Async APIs
- Modular Architecture

---

# 🏗️ Tech Stack

## Frontend

- React
- React Router
- Context API
- Axios
- Tailwind CSS
- CRACO

---

## Backend

- FastAPI
- Python
- MongoDB
- Motor
- Pydantic
- JWT Authentication

---

## AI Stack

- Groq LLM
- Hugging Face Sentence Transformers
- BAAI/bge-small-en-v1.5 Embedding Model

---

# 📂 Project Structure

```text
AI-Commerce
│
├── backend
│   ├── server.py
│   ├── llm.py
│   ├── requirements.txt
│   └── seed.py
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── tailwind.config.js
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/hs744413-harsh/AI-commerce.git

cd AI-commerce
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`

```env
MONGO_URL=

DB_NAME=

GROQ_API_KEY=

CORS_ORIGINS=http://localhost:3000
```

Run Backend

```bash
uvicorn server:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm start
```

Create `.env`

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|----------|----------------|-------------------------|
| GET | /api/products | Get Products |
| GET | /api/products/{id} | Product Details |
| POST | /api/auth/login | User Login |
| POST | /api/chat | AI Chat |
| POST | /api/search | AI Product Search |

---

# 🤖 AI Workflow

```text
User Query
      │
      ▼
Frontend (React)
      │
      ▼
FastAPI Backend
      │
      ▼
Embedding Generation
(Hugging Face)
      │
      ▼
Vector Similarity Search
      │
      ▼
Groq LLM
      │
      ▼
AI Response
```

---

# 🚀 Future Improvements

- Product Recommendation Engine
- RAG Architecture
- Voice Shopping
- Image Search
- Admin Dashboard
- Payment Gateway
- Wishlist
- Inventory Management
- Docker Deployment
- CI/CD Pipeline
- Kubernetes Deployment

---

# 📈 Learning Outcomes

This project helped in learning:

- Full Stack Development
- REST APIs
- FastAPI
- React
- MongoDB
- Authentication
- AI Integration
- LLM APIs
- Semantic Search
- Hugging Face Embeddings
- Production Project Structure

---

# 👨‍💻 Author

### Harsh Panwar

B.Tech CSE

KIET Group of Institutions

GitHub

https://github.com/hs744413-harsh

LinkedIn

(https://www.linkedin.com/in/harsh-panwar-89050a348/)

---

# ⭐ Support

If you found this project useful,

⭐ Star this repository.

Fork it.

Contribute.

Share it with others.

---

<div align="center">

## 🚀 Happy Coding 🚀

Made with ❤️ using React • FastAPI • MongoDB • Groq • Hugging Face

</div>
