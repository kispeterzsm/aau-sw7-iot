ARG PYTHON_VERSION=3.12
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY model_server /app/model_server
COPY settings.cfg /app
COPY model_server.py /app


COPY nlp /app/nlp

RUN --mount=type=cache,target=/root/.cache,id=pip \
    python -m pip install uv 

RUN --mount=type=cache,target=/root/.cache,id=pip \
    uv pip install --system -r model_server/requirements.txt

RUN python -m spacy download en_core_web_sm

EXPOSE 8001

CMD ["python3", "model_server.py"]
