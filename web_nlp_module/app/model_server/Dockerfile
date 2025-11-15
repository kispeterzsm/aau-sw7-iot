ARG PYTHON_VERSION=3.12
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

####### Add your own installation commands here #######
# RUN pip install some-package
# RUN wget https://path/to/some/data/or/weights
# RUN apt-get update && apt-get install -y <package-name>

WORKDIR /app
COPY . /app

# Install litserve and requirements
RUN python -m spacy download en_core_web_sm
RUN pip install --no-cache-dir litserve==0.2.16 -r requirements.txt
EXPOSE 8001
CMD ["python", "/app/server.py"]
