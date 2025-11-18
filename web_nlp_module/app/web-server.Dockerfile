FROM python:3.12-slim

COPY ./web /web
COPY server.py .

RUN pip install --no-cache-dir -r web/requirements.txt
COPY model_server /model_server

EXPOSE 8080

# Default command to run your Python app
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
