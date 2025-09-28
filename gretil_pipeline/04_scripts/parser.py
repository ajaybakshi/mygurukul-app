import json
import os
import sys
import unicodedata
from pathlib import Path
import pandas as pd
from llm_tagger import get_llm_tags_for_verse  # <-- We still import our AI Scholar

# --- Configuration ---
SOURCE_DATA_DIR = "01_source_data"
PROCESSED_TEXTS_DIR = "02_processed_texts"
METADATA_OUTPUT_DIR = "03_metadata_output"
TAGGING_DATA_DIR = "05_tagging_data"
GCS_BUCKET_BASE_URI = "gs://mygurukul-sacred-texts-corpus/Processed_Documents"
THESAURUS_FILE = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")  # From revival script

def log_to_stderr(message):
    """A helper function to print log messages to the standard error stream."""
    print(message, file=sys.stderr)

def sanitize_for_filename(text):
    """Aggressively sanitizes a string to be 100% safe for filenames and GCS paths."""
    nfkd_form = unicodedata.normalize('NFKD', text)
    ascii_bytes = nfkd_form.encode('ASCII', 'ignore')
    safe_string = ascii_bytes.decode('ASCII')
    safe_string = ''.join(c if c.isalnum() else '_' for c in safe_string)
    return safe_string

def load_tagging_bible():
    """
    Loads the scripture knowledge base from the simplified Excel file (Sheet 2 only).
    """
    excel_path = os.path.join(TAGGING_DATA_DIR, "Gurukul_DCS-mapping.xlsx")
    try:
        df = pd.read_excel(excel_path, sheet_name=1)
        df = df.dropna(subset=['DCS JSON'])  # Ignore rows without a JSON filename
        df = df.set_index('DCS JSON')
        knowledge_base = df.to_dict(orient='index')
        final_kb = {}
        for key, value in knowledge_base.items():
            final_kb[key] = {
                "scripture_type": value['Unnamed: 0'],
                "thematic_category": [value['Unnamed: 0']]  # Create a list for consistency
            }
        log_to_stderr("Successfully loaded simplified Tagging Bible from Sheet 2.")
        return final_kb
    except Exception as e:
        log_to_stderr(f"FATAL ERROR: Could not load or parse the Tagging Bible at {excel_path}. Error: {e}")
        return None

def load_amarakosha_thesaurus():
    """Loads the revived Amarkosha thesaurus for Layer 2 enrichment."""
    try:
        with open(THESAURUS_FILE, 'r', encoding='utf-8') as f:
            thesaurus = json.load(f)
        log_to_stderr(f"Successfully loaded Amarkosha thesaurus with {len(thesaurus)} entries.")
        return thesaurus
    except Exception as e:
        log_to_stderr(f"ERROR: Could not load Amarkosha thesaurus at {THESAURUS_FILE}. Error: {e}")
        return {}

def get_lexical_tags(verse_text, thesaurus):
    """
    Generates lexical tags (Layer 2) by matching verse words to Amarkosha headwords.
    """
    words = verse_text.lower().split()  # Basic split; consider a Sanskrit tokenizer for better accuracy
    tags = set()
    for word in words:
        if word in thesaurus:
            tags.add(thesaurus[word])
    return list(tags)

def process_gretil_file(source_file_path, scripture_knowledge_base, thesaurus):
    """Processes a GRETIL JSON file and prints clean, super-enriched JSONL data."""
    log_to_stderr(f"--- Starting processing for: {source_file_path} ---")
    
    source_filename = Path(source_file_path).name
    tagging_info = scripture_knowledge_base.get(source_filename, {})
    scripture_type = tagging_info.get("scripture_type", "Unknown")
    thematic_categories = tagging_info.get("thematic_category", [])
    
    with open(source_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_title = data.get('text', 'Unknown Title')  # Keep for metadata

    # NEW: Use input filename stem for safe_title and naming
    safe_title = sanitize_for_filename(Path(source_file_path).stem)
    
    edition = data.get('edition', 'Unknown Edition')
    
    verses = data.get('lines', [])
    if not verses:
        log_to_stderr(f"Warning: No verses found in {source_filename}")
        return

    text_output_subdir = os.path.join(PROCESSED_TEXTS_DIR, safe_title)
    os.makedirs(text_output_subdir, exist_ok=True)

    for i, verse_data in enumerate(verses, 1):
        verse_text = ' '.join(word.get('w', '') for word in verse_data)
        verse_filename = f"{safe_title}_v{i}.txt"  # NEW: "_v{i}" format
        local_verse_path = os.path.join(text_output_subdir, verse_filename)
        
        with open(local_verse_path, 'w', encoding='utf-8') as text_file:
            text_file.write(verse_text)

        doc_id = f"{safe_title.lower()}_verse_{i}"
        gcs_uri = f"{GCS_BUCKET_BASE_URI}/{safe_title}/{verse_filename}"
        
        # Layer 1: Thematic categories from tagging bible
        # Layer 3: LLM tags
        log_to_stderr(f"  > Getting LLM tags for verse {i}...")
        llm_tags = get_llm_tags_for_verse(doc_id, verse_text, scripture_type)
        
        # Layer 2: Lexical tags from Amarkosha thesaurus
        lexical_tags = get_lexical_tags(verse_text, thesaurus)

        record = {
            "id": doc_id,
            "content": {"uri": gcs_uri, "mimeType": "text/plain"},
            "structData": {
                "source_title": original_title,
                "verse_number": i,
                "scripture_type": scripture_type,
                "thematic_category": thematic_categories,  # Layer 1
                "lexical_tags": lexical_tags,             # Layer 2
                "llm_tags": llm_tags                      # Layer 3
            }
        }
        # This line ensures the perfect JSONL format for Vertex AI
        print(json.dumps(record, ensure_ascii=False))

    log_to_stderr(f"--- Successfully processed {len(verses)} verses for '{original_title}' (output folder: {safe_title}). ---")

if __name__ == "__main__":
    os.makedirs(PROCESSED_TEXTS_DIR, exist_ok=True)
    os.makedirs(METADATA_OUTPUT_DIR, exist_ok=True)
    
    knowledge_base = load_tagging_bible()
    if not knowledge_base:
        sys.exit(1)
    
    thesaurus = load_amarakosha_thesaurus()  # Load Layer 2 thesaurus
    
    # Prompt for input file
    input_file_name = input("Enter the name of the GRETIL JSON file to process (e.g., Aitereya_Upanishad.json): ").strip()
    source_file = os.path.join(SOURCE_DATA_DIR, input_file_name)
    
    if not os.path.exists(source_file):
        log_to_stderr(f"ERROR: File '{source_file}' not found. Please check the name and try again.")
        sys.exit(1)
    
    # Quick check if file might be JSONL (multiple objects)
    with open(source_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    if len(lines) > 1 and all(line.strip().startswith('{') for line in lines if line.strip()):
        log_to_stderr("ERROR: This looks like a JSONL file (multiple JSON objects). The script expects a single JSON file (raw GRETIL input). Please provide a raw JSON file, not an enriched JSONL output.")
        sys.exit(1)
    
    process_gretil_file(source_file, knowledge_base, thesaurus)
