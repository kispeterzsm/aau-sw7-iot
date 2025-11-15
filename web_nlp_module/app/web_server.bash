#!/usr/bin/env bash

if [ -d "web_server_env" ]; then
    echo "Not first exec"
    source web_server_env/bin/activate
else
    echo "Python env does not exist"
    python3 -m venv web_server_env
    source web_server_env/bin/activate
    pip3 install -r backend/requirements.txt
fi

uvicorn server:app --host 0.0.0.0 --port 8080