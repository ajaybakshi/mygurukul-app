import json
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np

# --- Configuration ---
TAGS_FILE = "master_conceptual_tags.json"
INDEX_FILE = "conceptual_tags.index"
MODEL_NAME = "all-MiniLM-L6-v2" # A good, fast model for this task
# -------------------

def create_vector_index():
    """
    Loads the master tags, generates embeddings, and saves them to a FAISS index.
    """
    print("Loading the master list of conceptual tags...")
    with open(TAGS_FILE, 'r', encoding='utf-8') as f:
        tags = json.load(f)

    print(f"Loaded {len(tags)} unique tags.")
    print(f"Loading embedding model: '{MODEL_NAME}'...")
    model = SentenceTransformer(MODEL_NAME)

    print("Generating embeddings for all tags. This may take a few minutes...")
    embeddings = model.encode(tags, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32')

    d = embeddings.shape[1]
    print(f"Embeddings generated with dimension: {d}")

    index = faiss.IndexFlatL2(d)
    print("Adding embeddings to the FAISS index...")
    index.add(embeddings)
    print(f"Index created with {index.ntotal} vectors.")

    faiss.write_index(index, INDEX_FILE)
    print(f"FAISS index successfully saved to '{INDEX_FILE}'.")

if __name__ == "__main__":
    create_vector_index()
