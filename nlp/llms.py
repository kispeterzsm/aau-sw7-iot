from huggingface_hub import login
import torch
from transformers import pipeline

class Local_LLM():
    def __init__(self, hf_token, model="google/gemma-3-1b-it", device="cuda", task="text-generation"):
        login(hf_token)
        self.pipeline = pipeline(
            task=task,
            model= model,
            device=device,
            dtype=torch.bfloat16
        )

    def prompt(prompt):
        return pipeline(text_inputs=prompt)