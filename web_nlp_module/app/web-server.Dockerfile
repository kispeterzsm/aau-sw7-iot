FROM python:3.12-slim

COPY ./web /web
COPY server.py .
COPY settings.cfg .

# try this to have the docker to build it faster
RUN --mount=type=cache,target=/root/.cache,id=pip \
    python -m pip install uv 

RUN --mount=type=cache,target=/root/.cache,id=pip \
    uv pip install --system -r web/requirements.txt

# normal pip install
# RUN pip install --no-cache-dir --user -r web/requirements.txt
COPY model_server /model_server

EXPOSE 8080

# Default command to run your Python app
CMD ["uvicorn", "server:APP", "--host", "0.0.0.0", "--port", "8080"]
