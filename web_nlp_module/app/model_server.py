import litserve as ls
from model_server.model_server import NLPAPI

def build_server():
    server = ls.LitServer(NLPAPI())
    return server

if __name__ == "__main__":
    server = build_server()
    print("Starting LitServe…")
    server.run(host="0.0.0.0", port=8001)