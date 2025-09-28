import os
import json
import sys  # NEW: Import sys for stderr logging
import google.generativeai as genai  # Assuming this is your import; adjust if needed

# --- Configuration ---
TAGGING_DATA_DIR = "05_tagging_data"
THESAURUS_FILE = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")  # From Amarkosha parser

def load_amarakosha_thesaurus():
    """Loads the Amarkosha thesaurus for Level 2 enrichment."""
    try:
        with open(THESAURUS_FILE, 'r', encoding='utf-8') as f:
            thesaurus = json.load(f)
        print(f"Successfully loaded Amarkosha thesaurus with {len(thesaurus)} entries.", file=sys.stderr)
        return thesaurus
    except Exception as e:
        print(f"ERROR: Could not load Amarkosha thesaurus at {THESAURUS_FILE}. Error: {e}", file=sys.stderr)
        return {}

def get_lexical_tags(verse_text, thesaurus):
    """Generates lexical tags (Level 2) by matching verse words to Amarkosha headwords."""
    words = verse_text.lower().split()  # Basic split; consider a Sanskrit tokenizer for better accuracy
    tags = set()
    for word in words:
        if word in thesaurus:
            tags.add(thesaurus[word])
    return list(tags)

def get_llm_tags_for_verse(verse_id: str, verse_text: str, scripture_type: str):
    """Generates LLM tags for a verse (Level 3), with error handling."""
    # Your existing prompt setup (from thread/error trace)
    prompt = f"Verse ID: {verse_id}\nVerse Text: {verse_text}\nScripture Type: {scripture_type}\nGenerate tags..."

    try:
        # Your existing model setup (keep as-is, since you said it's correct)
        model = genai.GenerativeModel('gemini-2.5-pro')  # Adjust if exact name differs
        response = model.generate_content(prompt)
        
        # Parse response (your existing logic; assuming it returns a list)
        llm_tags = response.text.split()  # Placeholder; replace with your parsing

        return llm_tags
    except Exception as e:
        print(f"Error calling Gemini API for verse {verse_id}: {e}", file=sys.stderr)
        return []  # Return empty list on failure for graceful degradation

# NEW: Integrated 3-level tagging function (cherry-picked from prior parser.py)
def enrich_verse(verse_id: str, verse_text: str, scripture_type: str, thematic_categories: list, thesaurus: dict):
    """Applies all 3 levels of enrichment to a verse."""
    # Level 1: Thematic (from bible)
    level1_tags = thematic_categories
    
    # Level 2: Lexical (from thesaurus)
    level2_tags = get_lexical_tags(verse_text, thesaurus)
    
    # Level 3: LLM
    level3_tags = get_llm_tags_for_verse(verse_id, verse_text, scripture_type)
    
    return {
        "thematic_category": level1_tags,  # Level 1
        "lexical_tags": level2_tags,       # Level 2
        "llm_tags": level3_tags            # Level 3
    }

# Your main logic or entry point (from original llm_tagger.py; integrate as needed)
if __name__ == "__main__":
    thesaurus = load_amarakosha_thesaurus()
    
    # Example usage (replace with your loop/processing)
    sample_verse_id = "test_verse_1"
    sample_verse_text = "Sample Sanskrit verse text here"
    sample_scripture_type = "Upanishads"
    sample_thematic = ["Upanishads"]
    
    enriched_data = enrich_verse(sample_verse_id, sample_verse_text, sample_scripture_type, sample_thematic, thesaurus)
    print(json.dumps(enriched_data, ensure_ascii=False))
