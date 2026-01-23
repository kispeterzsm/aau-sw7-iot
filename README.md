# Information Origin Tracker (IOT)

![License](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Status](https://img.shields.io/badge/Status-Development-yellow)

**Information Origin Tracker** is a distributed **forensic analysis engine** designed to trace the provenance of digital content. Developed as a university project at Aalborg University (AAU) for the Fall 2025 semester, this system empowers users to verify claims by identifying the original webpage where a specific piece of information first appeared.

The system utilizes a **Microservices Architecture** to orchestrate NLP analysis, stealth web scraping, and data aggregation, effectively building a chronological timeline of information propagation.

---

## Key Features

* **Origin Tracking:** Input a URL or text claim to find its original source on the web.
* **Forensic Timeline:** Visualizes the spread of information from the "Spark" (origin) to the most recent mentions.
* **AI-Powered:** Uses a local Large Language Model (Qwen) for intelligent query generation and Named Entity Recognition (NER).
* **Stealth Scraping:** Bypasses bot detection to retrieve accurate search results from multiple regions.
* **User Accounts:** Search history, authentication, and email notifications.

---

## Architecture & Tech Stack

The project is built as a set of decoupled microservices managed via Docker and Kubernetes.

| Service | Tech Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | **Next.js**, React, Tailwind CSS | Responsive user interface for submitting claims and viewing analysis results. |
| **Middleware** | **Java Spring Boot** | Central API gateway handling business logic, authentication, and caching. |
| **NLP Module** | **Python**, PyTorch, **Qwen LLM** | GPU-accelerated service for generating search queries and extracting entities. |
| **Web Search** | **Python**, Stealth-Requests | Lightweight gateway that scrapes Bing for news and web results. |
| **Email Service** | **Python**, FastAPI | Handles transactional emails (e.g., welcome messages, OTPs). |
| **Database** | **PostgreSQL** | Stores user data, search history, and cached link analysis. |

---

## Getting Started

### Prerequisites
* **Docker** & **Docker Compose** installed.
* **NVIDIA GPU** (Recommended) with CUDA support for the NLP module.
* **Hugging Face Token** (Required to download the Qwen model).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/aau-sw7-iot.git](https://github.com/your-username/aau-sw7-iot.git)
    cd aau-sw7-iot
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the root directory (or rename `.env.example` if available) and add your Hugging Face token:
    ```env
    HF_TOKEN=your_huggingface_token_here
    AUTH_TOKEN_NGROK=optional_ngrok_token
    ```

3.  **Build the NLP Base Image (Crucial Step):**
    The NLP module relies on a heavy base image containing the LLM weights. You must build this first.
    ```bash
    cd nlp_module
    docker build -f Dockerfile.base --build-arg HF_TOKEN="your_token" -t local/llm-base:v1 .
    cd ..
    ```

4.  **Run the System:**
    Start all microservices using Docker Compose.
    ```bash
    docker-compose up --build
    ```

### Accessing the Application
* **Frontend (Web UI):** [http://localhost:3000](http://localhost:3000)
* **MailDev (Email Sandbox):** [http://localhost:1080](http://localhost:1080) (View sent emails here)
* **API Health Check:** [http://localhost:8999/health](http://localhost:8999/health)

---

## Project Structure

```plaintext
├── frontend/             # Next.js Web Application
├── middleware/           # Spring Boot REST API
├── nlp_module/           # Python GPU AI Service
├── web_search/           # Python Search Scraper
├── email_service/        # Python Email Microservice
├── k8s/                  # Kubernetes Deployment Manifests
└── docker-compose.yml    # Local Development Orchestration
