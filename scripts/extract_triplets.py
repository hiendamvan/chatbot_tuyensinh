from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sys

model_name = "Babelscape/rebel-large"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def extract_triplets(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    output = model.generate(**inputs, max_length=256)
    decoded = tokenizer.decode(output[0], skip_special_tokens=True)

    # Parse theo định dạng REBEL: "<triplet> <triplet> ..."
    triplets = []
    for triple in decoded.split("<triplet>"):
        parts = triple.strip().split(";")
        if len(parts) == 3:
            triplets.append(f"{parts[0].strip()}, {parts[1].strip()}, {parts[2].strip()}")
    return triplets

if __name__ == "__main__":
    text = sys.argv[1]
    triplets = extract_triplets(text)
    print("\n".join(triplets))
