import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import vertexai
from vertexai.generative_models import GenerativeModel
import unicodedata

class QueryEnhancer:
    def __init__(self, amarakosha_path, tags_path, index_path):
        """Initializes the enhancer by loading and normalizing all necessary assets."""
        print("Initializing QueryEnhancer...")
        self.amarakosha_path = amarakosha_path
        self.tags_path = tags_path
        self.index_path = index_path

        # Load the raw thesaurus
        amarakosha_raw = self._load_json(self.amarakosha_path)
        # Create a new, normalized version for lookups
        self.amarakosha_dict = {self._normalize(key): value for key, value in amarakosha_raw.items()}

        self.conceptual_tags = self._load_json(self.tags_path)
        self.faiss_index = faiss.read_index(self.index_path)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print(f"QueryEnhancer initialized successfully with {len(self.amarakosha_dict)} normalized Amarakosha terms.")

    def _load_json(self, file_path):
        """Helper to load a JSON file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _normalize(self, s):
        """Converts a string to lowercase ASCII by removing diacritics."""
        return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()

    def _stage1_conceptual_bridge(self, query):
        """Stage 1: Connects to Gemini to generate Sanskrit conceptual terms."""
        print("Executing Stage 1 (Gemini Conceptual Bridge)...")
        PROJECT_ID = "gurukul-468712"
        LOCATION = "global"
        vertexai.init(project=PROJECT_ID, location=LOCATION)

        prompt = (
            "You are a highly specialized API endpoint that translates English concepts into Sanskrit. "
            "Your only function is to receive an English query and return a JSON array of up to 5 core Sanskrit philosophical terms that capture the query's essence. "
            "Do not include any conversational text, explanations, or markdown formatting. Your response must be only the raw JSON array. "
            f"For example, for the query 'the nature of the self', your entire response must be: [\"ātman\", \"jīva\"]\n\n"
            "Process the following query:\n"
            f"Query: \"{query}\""
        )

        model = GenerativeModel("gemini-2.5-pro") # Using stable 1.5 Pro
        response = model.generate_content(prompt)

        try:
            response_text = response.text.strip()
            sanskrit_concepts = json.loads(response_text)
            if isinstance(sanskrit_concepts, list) and all(isinstance(c, str) for c in sanskrit_concepts):
                print(f"  > Gemini identified concepts: {sanskrit_concepts}")
                return sanskrit_concepts
            else:
                print("  > Warning: Gemini returned an unexpected format. Using query as fallback.")
                return [query.lower()]
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"  > Warning: Could not parse Gemini response. Using query as fallback. Error: {e}")
            return [query.lower()]

    def _stage2_lexical_expansion(self, sanskrit_concepts):
        """Stage 2: Performs lexical expansion using the normalized Amarakosha thesaurus."""
        print("Executing Stage 2 (Normalized Amarakosha Expansion)...")
        synonyms = set()
        for concept in sanskrit_concepts:
            # Normalize the concept from Gemini before looking it up
            normalized_concept = self._normalize(concept)
            synonym = self.amarakosha_dict.get(normalized_concept)
            
            if isinstance(synonym, str) and len(synonym) > 2:
                synonyms.add(synonym)
        
        print(f"  > Found lexical expansions: {list(synonyms)}")
        return list(synonyms)

    def _stage3_conceptual_mapping(self, query, top_k=7):
        """Stage 3: Maps query to corpus-grounded tags using FAISS."""
        print("Executing Stage 3 (FAISS Conceptual Mapping)...")
        query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
        _distances, indices = self.faiss_index.search(query_embedding, top_k)
        mapped_tags = [self.conceptual_tags[i] for i in indices[0]]
        print(f"  > Mapped to conceptual tags: {mapped_tags}")
        return mapped_tags

    def enhance(self, original_query):
        """Runs the full enhancement pipeline and returns a structured query object."""
        print(f"\nEnhancing query: '{original_query}'")
        sanskrit_concepts = self._stage1_conceptual_bridge(original_query)
        lexical_expansions = self._stage2_lexical_expansion(sanskrit_concepts)
        conceptual_tags = self._stage3_conceptual_mapping(original_query)
        final_query_string = " ".join(set(sanskrit_concepts + lexical_expansions + conceptual_tags))
        query_object = {
            "user_query": original_query,
            "sanskrit_concepts": sanskrit_concepts,
            "lexical_expansions": lexical_expansions,
            "conceptual_tags": conceptual_tags,
            "final_query_string": final_query_string,
            "scoping_filter": None
        }
        print("Enhancement complete. Final query object created.")
        return query_object
