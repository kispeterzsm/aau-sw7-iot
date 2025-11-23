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
    def __init__(self, model="google/gemma-3-4b-it", device="cuda", task="text-generation"):
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
        self.llm_prompt="""
                You are an assistant that helps the user search the internet. You recieve a sentence as input, and you must output a Google search style string.
                **IMPORTANT: Respond in the *same language* as the input sentence.**
                Input:
                President Donald Trump was back in public Tuesday to announce a new location for US Space Command headquarters
                Output:
                US Space Command new location
                Input:
                Nvidia agreed to invest $5 billion in the American chip maker, which will see Intel design custom x86 chips for it.
                Output:
                Nvidia Intel investment
                Input:
                {sentence}
                Output:
                """

    def split_into_sentences(self, text) -> List[str]:
        """Split text into sentences using spacy."""
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents]

    def rank_sentences(self, sentences: List[str], top_x: int = 5) -> List[Dict]:
        """
        Ranks sentences by an importance score based on Named Entity Recognition (NER).

        Args:
            sentences (List[str]): List of sentences to analyze.
            top_x (int): Number of top sentences to return.

        Returns:
            JSON style list of top X sentences with their importance scores.
        """

        scored_sentences = []

        for sentence in sentences:
            doc = self.nlp(sentence)
            score = 0

            # Count entities with different weights (tweakable)
            for ent in doc.ents:
                if ent.label_ in {"PERSON"}:
                    score += 3
                elif ent.label_ in {"ORG", "GPE"}:  # Organizations, Countries, Cities
                    score += 2
                elif ent.label_ in {"DATE", "TIME"}:
                    score += 2
                elif ent.label_ in {"CARDINAL", "QUANTITY", "MONEY", "PERCENT"}:
                    score += 1
                else:
                    score += 0.5  # catch-all for other entities

            scored_sentences.append({
                "sentence":sentence,
                "importance":score
            })

        # Sort sentences by score (descending) and return top X
        scored_sentences.sort(key=lambda x: x["importance"], reverse=True)
        return scored_sentences[:top_x]

    def extract_answer(self, sentence:str) -> List[str]:
        """
        Extracts the desired answer part of a text given by an LLM.
        """
        return sentence.split("\n")[-2].strip()
        

    def process_raw_text(self,input_text:str, top_x:int = 5) -> List[dict]:
        """
        Given an input text, breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases.
        """
        sentences = self.split_into_sentences(input_text)
        importants = self.rank_sentences(sentences, top_x)
        for sentence in importants:
            output=self.llm.prompt(self.llm_prompt.format(sentence=sentence["sentence"]), stop_sequence="Input:")
            sentence["search_term"]=self.extract_answer(output[0]['generated_text'])
        return importants


    def process_article(self, article:Article) -> List[dict]:
        article = nlp_article(article)
        importants = self.split_into_sentences(article.summary)
        processed_sentences = []
        for sentence in importants:
            output=self.llm.prompt(self.llm_prompt.format(sentence=sentence), stop_sequence="Input:")
            processed_sentences.append({"sentence": sentence, "search_term": self.extract_answer(output[0]['generated_text'])})
        return processed_sentences

    def do_the_thing(self, input, top_x:int=5, query_variations:int=1) -> List[dict]:
        """
        Given an input breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases. If a `newspaper.Article` class is given as input `top_x` will be ignored as this method uses `article.summary`
        """
        searchterms=None
        if isinstance(input, Article):
            searchterms= self.process_article(input)
        else:
            searchterms= self.process_raw_text(input, top_x)
        
        if query_variations<=1:
            return searchterms

        res=[]
        for query in searchterms:
            res.append(query)
            variations=self.query_variations(query["searchterm"], query_variations)
            for var in variations:
                res.append({"sentence":query["sentence"], "searchterm":var})
                
        return res

    def query_variations(self, query: str, num_variations: int = 5) -> List[str]:
            """
            Generates conceptually related queries from the input string using a proper chat template.
            """

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
                self.llm.pipeline.tokenizer.eos_token_id,
                self.llm.pipeline.tokenizer.convert_tokens_to_ids("<|eot_id|>")
            ]

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
            
            queries.insert(0, query)
            return list(dict.fromkeys(queries))

def nlp_article(article:Article) -> Article:
    """
    Runs article.nlp() and returns the result, so you can access data such as `article.keywords` or `article.summary`.
    """
    article.nlp()
    return article