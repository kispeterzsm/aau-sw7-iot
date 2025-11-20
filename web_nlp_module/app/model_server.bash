#!/usr/bin/env bash

if [ -d "model_server_env" ]; then
    echo "Not first exec"
    source model_server_env/bin/activate
else
    echo "Python env does not exist"
    python3 -m venv model_server_env
    source model_server_env/bin/activate
    pip3 install -r model_server/requirements.txt
    python -m spacy download en_core_web_sm
fi

python3 model_app.py