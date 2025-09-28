import json
from google.cloud import storage
import os

# --- Configuration ---
# IMPORTANT: Update this path to your actual service account key file
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/AJ/Desktop/mygurukul-app/verrtex-ai-key.json"
BUCKET_NAME = "mygurukul-sacred-texts-corpus"
PREFIX = "Metadata/"
OUTPUT_FILE = "master_conceptual_tags.json"
# -------------------

def mine_conceptual_tags():
    """
    Connects to GCS, iterates through all .jsonl files in the specified prefix,
    and extracts all unique 'llm_tags'.
    """
    print("Connecting to Google Cloud Storage...")
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)

    all_tags = set()

    blobs = bucket.list_blobs(prefix=PREFIX)
    jsonl_files = [blob for blob in blobs if blob.name.endswith(".jsonl")]

    print(f"Found {len(jsonl_files)} JSONL files to process.")

    for i, blob in enumerate(jsonl_files):
        print(f"Processing file {i+1}/{len(jsonl_files)}: {blob.name}...")
        content = blob.download_as_text()

        for line in content.splitlines():
            try:
                data = json.loads(line)
                tags = data.get('structData', {}).get('llm_tags', [])
                for tag in tags:
                    all_tags.add(tag)
            except json.JSONDecodeError:
                print(f"  Warning: Skipping a malformed JSON line in {blob.name}")

    print(f"\nFound a total of {len(all_tags)} unique conceptual tags.")

    sorted_tags = sorted(list(all_tags))
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(sorted_tags, f, ensure_ascii=False, indent=2)

    print(f"Successfully saved all unique tags to '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    mine_conceptual_tags()
