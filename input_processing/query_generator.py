import torch
from transformers import pipeline
from typing import List

# Universal Device Detection
if torch.cuda.is_available():
    device = "cuda"
    device_name = "NVIDIA CUDA"
    model_kwargs = {"dtype": torch.bfloat16, "load_in_4bit": True}
elif torch.backends.mps.is_available():
    device = "mps"
    device_name = "Apple MPS"
    model_kwargs = {"dtype": torch.bfloat16}
else:
    device = "cpu"
    device_name = "CPU"
    model_kwargs = {} # Use default settings for CPU

class QueryGenerator:
    """
    Generates conceptually related search queries using Gemma 2B on the best available device.
    """
    def __init__(self, model_id: str = "google/gemma-2b-it"):
        print(f"Loading model for {device_name}: {model_id}...")
       
        self.generator = pipeline(
            "text-generation",
            model=model_id,
            model_kwargs=model_kwargs,
            device_map=device
        )
        print(f"QueryGenerator initialized successfully on {device_name} device.")

    def generate(self, user_input: str, num_variations: int = 5) -> List[str]:
        """
        Generates conceptually related queries from the input string.
        """
        messages = [
            {
                "role": "user",
                "content": f"Generate {num_variations} diverse search engine queries about the topic '{user_input}'.\n"
                           f"The queries should be conceptually different. Do not use a numbered list or bullet points. Just list each query on a new line."
            },
        ]
        
        prompt = self.generator.tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )

        terminators = [
            self.generator.tokenizer.eos_token_id,
            self.generator.tokenizer.convert_tokens_to_ids("<|eot_id|>")
        ]

        results = self.generator(
            prompt,
            max_new_tokens=150,
            eos_token_id=terminators,
            do_sample=True,
            temperature=0.7,
            top_p=0.95,
        )
        
        generated_text = results[0]['generated_text']
        response_text = generated_text[len(prompt):].strip()
        queries = [line.strip() for line in response_text.split("\n") if line.strip()]
        
        queries.insert(0, user_input)
        return list(dict.fromkeys(queries))