import os
import logging

from nlp import NLP_Pipeline
from model_server.article_conversions import dict_to_article

from newspaper import Article
import litserve as ls

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

LOGGER = logging.getLogger(__name__)

class NLPAPI(ls.LitAPI):
    def setup(self, device):

        # load env variables
        HF_TOKEN = os.getenv("HF_TOKEN")

        # download models, etc.
        LOGGER.debug("Initializing...")
        self.model = NLP_Pipeline(HF_TOKEN)

    def decode_request(self, request):

        input = request

        return dict_to_article(input)

    def predict(self, x):

        return self.model.do_the_thing(x)

    def encode_response(self, output):

        return output

if __name__ == "__main__":
    api = NLPAPI()
    server = ls.LitServer(api, accelerator="gpu")
    server.run(port=8001)
