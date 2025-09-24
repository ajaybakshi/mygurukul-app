import json
import os
import sys
import unicodedata
from pathlib import Path

def log_to_stderr(message):
    """A helper function to print log messages to the standard error stream."""
    print(message, file=sys.stderr)

def sanitize_for_filename(text):
    """Aggressively sanitizes a string to be safe for filenames and GCS paths."""
    # Normalize to separate base characters from diacritics
    nfkd_form = unicodedata.normalize('NFKD', text)
    # Encode to ASCII, ignoring any characters that can't be represented
    ascii_bytes = nfkd_form.encode('ASCII', 'ignore')
    # Decode back to a string
    safe_string = ascii_bytes.decode('ASCII')
    # Replace any remaining non-alphanumeric characters
    safe_string = ''.join(c if c.isalnum() else '_' for c in safe_string)
    return safe_string

def process_gretil_file(source_file_path):
    """
    Processes a GRETIL JSON file and prints clean JSONL data to stdout for redirection.
    """
    log_to_stderr(f"--- Starting processing for: {source_file_path} ---")
    
    with open(source_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    source_filename = Path(source_file_path).name
    title = data.get('text', 'Unknown Title')
    safe_title = sanitize_for_filename(title)
    edition = data.get('edition', 'Unknown Edition')
    
    verses = data.get('lines', [])
    if not verses:
        log_to_stderr(f"Warning: No verses found in {source_filename}")
        return

    # This script no longer writes text files directly, assuming run_ingestion.sh handles it.
    # We focus only on producing the perfect JSONL to stdout.

    for i, verse_data in enumerate(verses, 1):
        verse_text = ' '.join(word.get('w', '') for word in verse_data)
        verse_filename = f"{safe_title}_verse_{i}.txt"
        
        doc_id = f"{safe_title.lower()}_verse_{i}"
        gcs_uri = f"gs://mygurukul-sacred-texts-corpus/Processed_Documents/{safe_title}/{verse_filename}"
        
        record = {
            "id": doc_id,
            "content": {"uri": gcs_uri, "mimeType": "text/plain"},
            "structData": {
                "source_title": title,
                "source_filename": source_filename,
                "edition": edition,
                "verse_number": i
            }
        }
        # Print the pure JSON object string to stdout. This is the key.
        print(json.dumps(record, ensure_ascii=False))

    log_to_stderr(f"--- Successfully generated {len(verses)} JSONL records for '{title}'. ---")
    log_to_stderr(f"--- IMPORTANT: Redirect this output to a .jsonl file. ---")


if __name__ == "__main__":
    source_file = os.path.join("01_source_data", "Siva_Upanishad.json")
    process_gretil_file(source_file)
