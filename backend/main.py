from fastapi import FastAPI

# API uygulamamızı başlatıyoruz
app = FastAPI(title="Fatura Yönetim Sistemi API")

# Sistemin çalışıp çalışmadığını test etmek için kök dizin (endpoint)
@app.get("/")
def read_root():
    return {"mesaj": "Fatura Yonetim Sistemi API basariyla calisiyor!"}