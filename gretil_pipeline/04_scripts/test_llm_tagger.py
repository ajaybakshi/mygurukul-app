import json
import os
import pandas as pd

# Config (adjust paths if needed)
TAGGING_DATA_DIR = "05_tagging_data"
dcs_path = os.path.join(TAGGING_DATA_DIR, "Gurukul_DCS-mapping.xlsx")
amarakosha_path = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")

# Sample data (hardcoded for light test)
sample_data = {
  "text": "Test Title",
  "lines": [
    [{"w": "धर्मो"}, {"w": "रक्षति"}, {"w": "रक्षितः"}],
    [{"w": "सत्यं"}, {"w": "वद"}]
  ]
}
source_filename = "test_verses.json"  # For DCS lookup simulation

# Load DCS (Layer 1)
def load_dcs_mapping():
    df = pd.read_excel(dcs_path, sheet_name=1)
    df = df.dropna(subset=['DCS JSON'])
    mapping = {row['DCS JSON']: {"type": row['Unnamed: 0'], "themes": [row['Unnamed: 0']]} for _, row in df.iterrows()}
    return mapping

# Load Amarakosha (Layer 2)
def load_amarakosha_thesaurus():
    with open(amarakosha_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Get Amarakosha concepts
def get_amarakosha_concepts(verse_text, thesaurus):
    words = verse_text.split()
    concepts = set(thesaurus.get(word) for word in words if word in thesaurus)
    return list(concepts)

# Stub for LLM (Layer 3) - Comment in to test (requires API key and network)
# def get_llm_tags(verse_text):
#     # Add your genai code here
#     return ["sample_tag1", "sample_tag2"]  # Placeholder

# Process sample
dcs_mapping = load_dcs_mapping()
amarakosha = load_amarakosha_thesaurus()
tagging_info = dcs_mapping.get(source_filename, {"type": "Unknown", "themes": []})

for i, verse_data in enumerate(sample_data['lines'], 1):
    verse_text = ' '.join(word.get('w', '') for word in verse_data)
    thematic = tagging_info['themes']
    amarkosha_concepts = get_amarakosha_concepts(verse_text, amarakosha)
    # llm_tags = get_llm_tags(verse_text)  # Uncomment for LLM test (1 call per verse)
    llm_tags = ["test_llm_tag"]  # Placeholder to skip API

    record = {
        "structData": {
            "thematic_category": thematic,  # Layer 1
            "amarkosha_concepts": amarkosha_concepts,  # Layer 2
            "llm_tags": llm_tags  # Layer 3
        }
    }
    print(json.dumps(record, ensure_ascii=False, indent=2))
