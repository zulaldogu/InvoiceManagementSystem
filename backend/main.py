import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from seed import seed_demo_data

from routers import (
    authentication,
    companies,
    customers,
    invoice_lines,
    invoices,
    products,
    profile_roles,
    profiles,
    roles,
    user_profiles,
    users,
)

if os.getenv("SEED_DEMO_DATA", "false").lower() == "true":
    seed_demo_data()

app = FastAPI(title="Fatura Yönetim Sistemi API")

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authentication.router)
app.include_router(companies.router)
app.include_router(products.router)
app.include_router(roles.router)
app.include_router(profiles.router)
app.include_router(profile_roles.router)
app.include_router(users.router)
app.include_router(user_profiles.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(invoice_lines.router)

@app.get("/")
def read_root():
    return {"mesaj": "Fatura Yonetim Sistemi API basariyla calisiyor!"}