import litserve as ls

from model_server.model_server import NLPAPI

if __name__ == "__main__":
    api = NLPAPI()
    server = ls.LitServer(api, accelerator="gpu")
    server.run(port=8001)

import litserve as ls
from model_server.model_server import NLPAPI

def build_server():
    api = NLPAPI()
    return ls.LitServer(api, accelerator="gpu")