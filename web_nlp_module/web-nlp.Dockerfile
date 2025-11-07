# This is the new base image required for GPU access
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

# Setup Python inside the CUDA image
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy files
COPY /web_nlp_module/app/ /app/
COPY /web_nlp_module/requirements.txt .

# Avoid dependency resolution errors
RUN pip install --upgrade pip

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Expose FastAPI port
EXPOSE 8080

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
