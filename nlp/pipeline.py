from huggingface_hub import login
import torch
from transformers import pipeline
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
            device=device,
            dtype=torch.bfloat16
        )

    def prompt(self, input_text:str) -> str:
        return self.pipeline(input_text,
              max_new_tokens=10,
              stop_sequence="Input:"
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
        

    def process_raw_text(self,input_text:str, top_x:int = 5) -> List[str]:
        """
        Given an input text, breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases.
        """
        sentences = self.split_into_sentences(input_text)
        importants = self.rank_sentences(sentences, top_x)
        for sentence in importants:
            output=self.llm.prompt(self.llm_prompt.format(sentence=sentence["sentence"]))
            sentence["search_term"]=self.extract_answer(output[0]['generated_text'])
        return importants


    def process_article(self, article:Article) -> List[str]:
        article = nlp_article(article)
        importants = self.split_into_sentences(article.summary)
        processed_sentences = []
        for sentence in importants:
            output=self.llm.prompt(self.llm_prompt.format(sentence=sentence))
            processed_sentences.append({"sentence": sentence, "search_term": self.extract_answer(output[0]['generated_text'])})
        return processed_sentences

    def do_the_thing(self, input, top_x:int=5):
        """
        Given an input breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases. If a `newspaper.Article` class is given as input `top_x` will be ignored as this method uses `article.summary`
        """
        if isinstance(input, Article):
            return self.process_article(input)
        else:
            return self.process_raw_text(input, top_x)


def nlp_article(article:Article) -> Article:
    """
    Runs article.nlp() and returns the result, so you can access data such as `article.keywords` or `article.summary`.
    """
    article.nlp()
    return article

if __name__=="__main__":
    hf_token=""
    nlp_pipe = NLP_Pipeline(hf_token)

    def url_to_searchterms(url:str, top_x:int=5):
        article=get_site_data(url)
        output=nlp_pipe.do_the_thing(article)

        return [sentence['search_term'] for sentence in output]

    url=""
    url_to_searchterms(url)