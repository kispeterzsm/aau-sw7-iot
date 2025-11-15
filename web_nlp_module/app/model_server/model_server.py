import os
import pprint

from nlp import NLP_Pipeline
from model_server.article_conversions import dict_to_article

from newspaper import Article
import litserve as ls
from pydantic import BaseModel


class Input(BaseModel):
    input: str
    search_depth: int # how many websearch results do you want  


class NLPAPI(ls.LitAPI):
    def setup(self, device):

        # load env variables
        HF_TOKEN = os.getenv("HF_TOKEN")

        # download models, etc.
        print(device, flush=True)
        print("Initializing...")
        self.model = NLP_Pipeline(HF_TOKEN)

    def decode_request(self, request: Input):
        pprint.pprint(request, flush=True)

        payload = request.get_json()
        input = payload["input"]
        pprint.pprint(input, flush=True)
        return dict_to_article(input)

    def predict(self, x: Article):
        pprint.pprint(str(x), flush=True)
        pprint.pprint(object(x), flush=True)
        
        return self.do_the_thing(x)

    def encode_response(self, output):
        pprint.pprint(output, flush=True)
        return output[0]

if __name__ == "__main__":
    api = NLPAPI()
    server = ls.LitServer(api, accelerator="gpu")
    server.run(port=8001)
