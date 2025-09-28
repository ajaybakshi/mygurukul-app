import json
import os
import sys
import unicodedata
from pathlib import Path
import pandas as pd
import google.generativeai as genai
import time

# --- Configuration ---
API_KEY = "AIzaSyCKoquY723X95WtexHxh7e2VeM1vU_jMsA"  # Replace with your key
genai.configure(api_key=API_KEY)

# Directories
SOURCE_DATA_DIR = "01_source_data"
PROCESSED_TEXTS_DIR = "02_processed_texts"
METADATA_OUTPUT_DIR = "03_metadata_output"
TAGGING_DATA_DIR = "05_tagging_data"
GCS_BUCKET_BASE_URI = "gs://mygurukul-sacred-texts-corpus/Processed_Documents"
CACHE_DIR = "06_llm_cache"
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(METADATA_OUTPUT_DIR, exist_ok=True)

def log_to_stderr(message):
    print(message, file=sys.stderr)

def sanitize_for_filename(text):
    nfkd_form = unicodedata.normalize('NFKD', text)
    ascii_bytes = nfkd_form.encode('ASCII', 'ignore')
    safe_string = ascii_bytes.decode('ASCII')
    safe_string = ''.join(c if c.isalnum() else '_' for c in safe_string)
    return safe_string

def load_dcs_mapping():
    excel_path = os.path.join(TAGGING_DATA_DIR, "Gurukul_DCS-mapping.xlsx")
    try:
        df = pd.read_excel(excel_path, sheet_name=1)
        df = df.dropna(subset=['DCS JSON'])
        mapping = {}
        for _, row in df.iterrows():
            key = row['DCS JSON']
            mapping[key] = {
                "type": row['Unnamed: 0'],
                "themes": [row['Unnamed: 0']]
            }
        return mapping
    except Exception as e:
        log_to_stderr(f"Error loading DCS mapping: {e}")
        return {}

def load_amarakosha_thesaurus():
    json_path = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        log_to_stderr(f"Error loading Amarakosha thesaurus: {e}")
        return {}

def get_llm_tags_for_verse(verse_id, verse_text, scripture_type):
    cache_file = os.path.join(CACHE_DIR, f"{verse_id}_tags.json")
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    expert_persona = "an expert in Vedic philosophy and spiritual symbolism"  # Default
    if "Arts" in scripture_type:
        expert_persona = "an expert in classical Indian arts, drama, and aesthetics"
    elif "Health" in scripture_type:
        expert_persona = "an expert in ancient Ayurvedic medicine and wellness"

    prompt = (
        f"You are {expert_persona}. Read the following Sanskrit verse:\n\n"
        f"'{verse_text}'\n\n"
        "Provide a brief, one-sentence English translation. Then, on a new line, "
        "provide a comma-separated list of 15-20 insightful tags about its themes, "
        "concepts, symbolism, and user-intent keywords. "
        "Format: Translation: [translation]. Tags: [tag1, tag2, ...]"
    )

    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content(prompt)
        tags_line = response.text.split("Tags:")[-1].strip()
        tags = [tag.strip() for tag in tags_line.split(',')]
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(tags, f)
        time.sleep(1)  # Rate limit
        return tags
    except Exception as e:
        log_to_stderr(f"Gemini API error for {verse_id}: {e}")
        return []

def get_amarakosha_concepts(verse_text, thesaurus):
    words = verse_text.split()
    concepts = set(thesaurus.get(word) for word in words if word in thesaurus)
    return list(concepts)

def process_gretil_file(source_file_path, dcs_mapping, amarakosha_thesaurus, input_file):
    log_to_stderr(f"--- Processing: {source_file_path} ---")
    
    source_filename = input_file  # Use input for lookup
    tagging_info = dcs_mapping.get(source_filename, {})
    scripture_type = tagging_info.get("type", "Unknown")
    thematic_categories = tagging_info.get("themes", [])
    
    with open(source_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_title = data.get('text', 'Unknown Title')
    safe_title = sanitize_for_filename(input_file.split('.')[0])  # Use input filename
    
    verses = data.get('lines', [])
    if not verses:
        log_to_stderr(f"No verses found in {source_filename}")
        return

    text_output_subdir = os.path.join(PROCESSED_TEXTS_DIR, safe_title)
    os.makedirs(text_output_subdir, exist_ok=True)

    # Prepare JSONL output file
    output_jsonl_path = os.path.join(METADATA_OUTPUT_DIR, f"{safe_title}_metadata.jsonl")
    total_verses = len(verses)
    with open(output_jsonl_path, 'w', encoding='utf-8') as jsonl_file:

        for i, verse_data in enumerate(verses, 1):
            verse_text = ' '.join(word.get('w', '') for word in verse_data)
            verse_filename = f"{safe_title}_verse_{i}.txt"
            local_verse_path = os.path.join(text_output_subdir, verse_filename)
            
            with open(local_verse_path, 'w', encoding='utf-8') as text_file:
                text_file.write(verse_text)

            doc_id = f"{safe_title.lower()}_verse_{i}"
            gcs_uri = f"{GCS_BUCKET_BASE_URI}/{safe_title}/{verse_filename}"
            
            amarkosha_concepts = get_amarakosha_concepts(verse_text, amarakosha_thesaurus)
            llm_tags = get_llm_tags_for_verse(doc_id, verse_text, scripture_type)

            record = {
                "id": doc_id,
                "content": {"uri": gcs_uri, "mimeType": "text/plain"},
                "structData": {
                    "source_title": original_title,
                    "verse_number": i,
                    "scripture_type": scripture_type,
                    "thematic_category": thematic_categories,
                    "amarkosha_concepts": amarkosha_concepts,
                    "llm_tags": llm_tags
                }
            }
            jsonl_file.write(json.dumps(record, ensure_ascii=False) + '\n')

            # Progress log every 50 verses
            if i % 50 == 0 or i == total_verses:
                log_to_stderr(f"Processed {i}/{total_verses} verses.")

    log_to_stderr(f"--- Processed {total_verses} verses for '{original_title}'. JSONL saved to {output_jsonl_path} ---")

if __name__ == "__main__":
    input_file = input("Enter the Hellwig JSON input file name (e.g., sa_zivopaniSad.json): ").strip()
    source_file_path = os.path.join(SOURCE_DATA_DIR, input_file)
    
    if not os.path.exists(source_file_path):
        log_to_stderr(f"Error: File {source_file_path} not found.")
        sys.exit(1)
    
    dcs_mapping = load_dcs_mapping()
    amarakosha_thesaurus = load_amarakosha_thesaurus()
    
    process_gretil_file(source_file_path, dcs_mapping, amarakosha_thesaurus, input_file)
