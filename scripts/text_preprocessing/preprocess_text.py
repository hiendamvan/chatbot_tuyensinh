# TODO: text preprocessing, remove stopwords, lowercase, word segmentation, chunk embedding, embedding on colab
import re 
import regex 
from vncorenlp import VnCoreNLP
from pyvi import ViTokenizer
from unidecode import unidecode

def cleaning_text(text, keep_punct=True):
    """ 
    Removing non-latin chars
    But keeping numbers and punctuations as default
    """
    if keep_punct:
        return regex.sub(u'[^\p{Latin}0-9[:punct:]]+', u' ', text)
    return regex.sub(u'[^\p{Latin}0-9]+', u' ', text)

def tokenizing(text):
    """
    This function returns a list of VNese tokens 
    extracted from a full sentence
    """
    return ViTokenizer.tokenize(text)

def joining(tokens):
    return ' '.join(tokens)

# remove VietNamese accent 
def main():
    with open("scripts/text_preprocessing/tuyensinh.txt", "r", encoding="utf-8") as f:
        content = f.read()
    text = cleaning_text(content)
    text = tokenizing(text)
    text = text.lower()
    # text = joining(text)
    with open("scripts/text_preprocessing/tuyensinh_clean.txt", "w", encoding="utf-8") as f:
        f.write(text)

main()


