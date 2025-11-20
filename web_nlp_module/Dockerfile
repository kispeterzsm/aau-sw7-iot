# Base image with GPU support
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

# Setup Python
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3-pip && rm -rf /var/lib/apt/lists/*
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy application files
COPY app/ /app/
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Set environment variable for model name
ENV MODEL_NAME="google/gemma-3-4b-it"

# Build-time argument for Hugging Face token
ARG HF_TOKEN
ENV HF_TOKEN=$HF_TOKEN

# Pre-download model weights + tokenizer into cache
RUN python - <<EOF
import os
from transformers import AutoTokenizer, AutoModelForCausalLM

model_name = os.environ["MODEL_NAME"]
hf_token = os.environ.get("HF_TOKEN")

print(f"Downloading model {model_name} to cache...")
if not hf_token or hf_token == "":
    print("Warning: HF_TOKEN build-arg is not set. Download may fail.")

# Download model and tokenizer
AutoTokenizer.from_pretrained(model_name, use_auth_token=hf_token)
AutoModelForCausalLM.from_pretrained(model_name, use_auth_token=hf_token)
print("Model files preloaded successfully.")
EOF

# Expose FastAPI port
EXPOSE 8080

# Run FastAPI using the recommended JSON format
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]