# app/main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Information Origin Tracker API")

# Simple in-memory variable
stored_text = ""

class TextInput(BaseModel):
    text: str

@app.post("/set")
def set_text(data: TextInput):
    """Takes input string (e.g., 'hello world') and stores it."""
    global stored_text
    stored_text = data.text
    return {"message": "Text stored successfully"}

@app.get("/get")
def get_text():
    """Returns the stored text."""
    return {"text": stored_text or "No text stored yet"}
