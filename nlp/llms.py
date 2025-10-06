from huggingface_hub import login
import torch
from transformers import StoppingCriteria, StoppingCriteriaList, pipeline
import re
import spacy
from typing import List, Tuple, Dict
# python -m spacy download en_core_web_sm

class StopOnToken(StoppingCriteria):
    def __init__(self, tokenizer, stoptoken):
        self.tokenizer = tokenizer
        self.stop_ids = tokenizer.encode(stoptoken)

    def __call__(self, input_ids, scores, **kwargs):
        # Check if last tokens match the stop token
        return input_ids[0, -len(self.stop_ids):].tolist() == self.stop_ids

class Local_LLM():
    def __init__(self, model="google/gemma-3-4b-it", device="cuda", task="text-generation"):
        self.pipeline = pipeline(
            task=task,
            model=model,
            device=device,
            dtype=torch.bfloat16
        )
        self.stopping_criteria = StoppingCriteriaList([StopOnToken(self.pipeline.tokenizer, "Input:")])

    def prompt(self, input_text):
        return self.pipeline(input_text,
              max_new_tokens=10,
              stopping_criteria=self.stopping_criteria,
        )

class NLP_Pipeline():
    def __init__(self, hf_token):
        login(hf_token)

        # Load models
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Warning: spacy model not found. Install with: python -m spacy download en_core_web_sm")
            return

        self.llm = Local_LLM()
        
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

    def extract_answers(sentence_list):
        """
        Extracts the desired answer part of a text given by an LLM.
        """
        answers=[]
        for sentence in sentence_list:
            sentence.get("search_term").split("\n")[-2].strip()
        return answers

    def do_the_thing(self,input_text, top_x = 5) -> List[str]:
        """
        Given an input article, breaks it up into sentences, then ranks these based on how important these are.
        The top_x most important sentences will then be passed to an LLM that transforms them into a websearch style phrase.
        Returns a list of these phrases.
        """
        sentences = self.split_into_sentences(input_text)
        importants = self.rank_sentences(sentences, top_x)
        for sentence in importants:
            output=self.llm.prompt(f"""
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
                {sentence["sentence"]}
                Output:
                """)
            sentence["search_term"]=output[0]['generated_text']
            
        return importants

if __name__=="__main__":
    # Loads in the models from Hugging Face
    hf_token=""
    nlp_pipe = NLP_Pipeline(hf_token)

    # returns a list of google search phrases
    output=nlp_pipe.do_the_thing("Elmo has been convicted for the alleged murder and subsequent cannibalistic devouring of his former friend, Cookie Monster.")
    print(output)