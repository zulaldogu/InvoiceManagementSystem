from fastapi import FastAPI

import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fatura Yönetim Sistemi API")


@app.get("/")
def read_root():
    return {"mesaj": "Fatura Yonetim Sistemi API basariyla calisiyor!"}