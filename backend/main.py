from fastapi import FastAPI

import models
from database import engine
from routers import products, roles, profiles, profile_roles, users, user_profiles, customers, invoices

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fatura Yönetim Sistemi API")

app.include_router(products.router)
app.include_router(roles.router)
app.include_router(profiles.router)
app.include_router(profile_roles.router)
app.include_router(users.router)
app.include_router(user_profiles.router)
app.include_router(customers.router)
app.include_router(invoices.router)

@app.get("/")
def read_root():
    return {"mesaj": "Fatura Yonetim Sistemi API basariyla calisiyor!"}