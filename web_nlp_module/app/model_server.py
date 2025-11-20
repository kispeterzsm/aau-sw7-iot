import litserve as ls
from model_server.model_server import NLPAPI

def build_server():
    print("Loading NLP (this will take an eternity)")
    api = NLPAPI()
    print("Model loaded.")
    return ls.LitServer(api)

if __name__ == "__main__":
    server = build_server()
    print("Starting LitServe…")
    server.run(host="0.0.0.0", port=8001)