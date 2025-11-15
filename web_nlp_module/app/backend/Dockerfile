ARG PYTHON_VERSION=3.12
FROM python:$PYTHON_VERSION-slim

WORKDIR /app

# Copy files
COPY . /app/
COPY ../web/ /app/

# Avoid dependency resolution errors
RUN pip install --upgrade pip

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
