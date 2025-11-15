from lightning.app import LightningApp, LightningFlow, LightningWork
from model_server import build_server


class LitAPIServer(LightningWork):
    def __init__(self):
        super().__init__(port=8001)

    def run(self):
        server = build_server()
        server.run(
            host="0.0.0.0",
            port=self.port
        )


class Root(LightningApp):
    def __init__(self):
        super().__init__()
        self.api = LitAPIServer()

    def run(self):
        pass


app = Root()