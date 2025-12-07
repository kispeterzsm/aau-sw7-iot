from huggingface_hub import login
import torch
from transformers import StoppingCriteria, StoppingCriteriaList, pipeline
import spacy
# python -m spacy download en_core_web_sm
import nltk
nltk.download('punkt_tab')
from newspaper import Article
from typing import List, Tuple, Dict

class Local_LLM():
    def __init__(self, model="Qwen/Qwen3-4B-Instruct-2507", device="cuda", task="text-generation"):
        self.pipeline = pipeline(
            task=task,
            model=model,
            device_map="auto",
            dtype=torch.bfloat16,
            model_kwargs={"load_in_4bit": True},
        )

    def prompt(self, input_text:str, max_new_tokens=10, stop_sequence:str=None) -> str:
        if stop_sequence:
            return self.pipeline(
                input_text,
                max_new_tokens=max_new_tokens,
                stop_sequence=stop_sequence
            )
        else:
            return self.pipeline(
                input_text,
                max_new_tokens=max_new_tokens
            )

class NLP_Pipeline():
    def __init__(self, hf_token:str):
        login(hf_token)

        # Load models
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Warning: spacy model not found. Install with: python -m spacy download en_core_web_sm")
            raise Exception("spacy model not found. Install with: python -m spacy download en_core_web_sm")

        self.llm = Local_LLM()

    def split_into_sentences(self, text) -> List[str]:
        """Split text into sentences using spacy."""
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents]


    def generate_search_term(self, sentence: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that helps the user search the internet. You receive a sentence as input, and you must output a Google search style string. Respond in the same language as the input."
            },
            {
                "role": "user",
                "content": "Input: President Donald Trump was back in public Tuesday to announce a new location for US Space Command headquarters"
            },
            {
                "role": "assistant",
                "content": "US Space Command new location"
            },
            {
                "role": "user",
                "content": "Input: Nvidia agreed to invest $5 billion in the American chip maker, which will see Intel design custom x86 chips for it."
            },
            {
                "role": "assistant",
                "content": "Nvidia Intel investment"
            },
            {
                "role": "user",
                "content": f"Input: {sentence}"
            }
        ]

        prompt = self.llm.pipeline.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        terminators = [
            self.llm.pipeline.tokenizer.eos_token_id
        ]
        
        possible_stop_tokens = ["<|im_end|>", "<|endoftext|>"]
        
        for token in possible_stop_tokens:
            token_id = self.llm.pipeline.tokenizer.convert_tokens_to_ids(token)
            if token_id is not None:
                terminators.append(token_id)

        outputs = self.llm.pipeline(
            prompt,
            max_new_tokens=50,
            eos_token_id=terminators,
            do_sample=False,
        )

        generated_text = outputs[0]['generated_text']
        answer = generated_text[len(prompt):].strip()
        
        return answer        

    def process_raw_text(self,input_text:str, top_x:int = 5) -> List[dict]:
        """
        Given an input text, breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases.
        """
        article = Article("")
        article.set_html(input_text)
        article.parse()
        article.set_text(input_text)
        article.set_title("Title")
        article = nlp_article(article)
        sentences = self.split_into_sentences(article.summary)
        
        processed_sentences = [] 
        
        for sentence_text in sentences:
            sentence_dict = {"sentence": sentence_text}
            sentence_dict["search_term"] = self.generate_search_term(sentence_text)
            processed_sentences.append(sentence_dict)
            
        return processed_sentences

    def process_article(self, article:Article) -> List[dict]:
        article = nlp_article(article)
        importants = self.split_into_sentences(article.summary)
        processed_sentences = []
        
        for sentence in importants:
            search_term = self.generate_search_term(sentence)
            processed_sentences.append({
                "sentence": sentence, 
                "search_term": search_term
            })
            
        return processed_sentences

    def do_the_thing(self, input, top_x:int=5, query_variations:int=1, do_ner=True) -> List[dict]:
        searchterms = None
        entities = None
        
        if isinstance(input, Article):
            searchterms = self.process_article(input)
        else:
            searchterms = self.process_raw_text(input, top_x)
        
        if do_ner:
            if isinstance(input, Article):
                entities = self.find_entities(input.text)
            else:
                entities = self.find_entities(input)
                
            for s in searchterms:
                s["entities"] = []
                for e in entities:
                    if e["name"] in s["sentence"]:
                        s["entities"].append(e)

        if query_variations <= 1:
            return searchterms

        res = []
        for query in searchterms:
            res.append(query)
            variations = self.query_variations(query["search_term"], query_variations)
            for var in variations:
                if var.lower() != query["search_term"].lower():
                    res.append({"sentence": query["sentence"], "search_term": var})
                
        return res

    def find_entities(self, text: str):
        entities = []
        labels={}
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in {"PERSON", "ORG", "GPE", "EVENT", "WORK_OF_ART"}:
                if ent.text not in entities:
                  entities.append(ent.text)
                  labels[ent.text]=ent.label_

        return [{"name":e, "label":labels[e]} for e in entities]

    def query_variations(self, query: str, num_variations: int = 5) -> List[str]:
            messages = [
                {
                    "role": "user",
                    "content": f"Generate {num_variations} diverse search engine queries about the topic '{query}'.\n"
                            f"The queries should be conceptually different. Do not use a numbered list or bullet points. Just list each query on a new line."
                },
            ]
            
            prompt = self.llm.pipeline.tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )

            terminators = [
                self.llm.pipeline.tokenizer.eos_token_id
            ]
            
            possible_stop_tokens = ["<|im_end|>", "<|endoftext|>"]
            
            for token in possible_stop_tokens:
                token_id = self.llm.pipeline.tokenizer.convert_tokens_to_ids(token)
                if token_id is not None:
                    terminators.append(token_id)

            outputs = self.llm.pipeline(
                prompt,
                max_new_tokens=256,
                eos_token_id=terminators,
                do_sample=True,
                temperature=0.7,
                top_p=0.95,
            )

            generated_text = outputs[0]['generated_text']
            response_text = generated_text[len(prompt):].strip()
            queries = [line.strip() for line in response_text.split("\n") if line.strip()]
            
            if query not in queries:
                queries.insert(0, query)
            return list(dict.fromkeys(queries))

def nlp_article(article:Article) -> Article:
    article.nlp()
    return article