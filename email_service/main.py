from fastapi import FastAPI
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader
import smtplib
from email.mime.text import MIMEText

app = FastAPI()

env = Environment(loader=FileSystemLoader("templates"))

class EmailRequest(BaseModel):
    to: str
    subject: str
    template: str
    variables: dict

@app.post("/send")
def send_email(req: EmailRequest):
    template = env.get_template(req.template + ".html")
    html = template.render(**req.variables)

    msg = MIMEText(html, "html")
    msg["Subject"] = req.subject
    msg["From"] = "IOT@example.com"
    msg["To"] = req.to

    with smtplib.SMTP("maildev", 1025) as server:
        server.send_message(msg)

    return {"status": "ok"}
