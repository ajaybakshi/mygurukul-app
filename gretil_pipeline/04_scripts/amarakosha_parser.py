import os
import re
import json

# --- Configuration ---
TAGGING_DATA_DIR = "05_tagging_data"
# UPDATED to use the original, correct filename from GRETIL
INPUT_XML_FILE = os.path.join(TAGGING_DATA_DIR, "sa_amarasiMha-nAmaliGgAnuzAsana.xml")
OUTPUT_JSON_FILE = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")
MINIMUM_WORD_MAPPINGS = 5000  # A realistic threshold for the full Amarkosha

# --- The Definitive Parser ---
try:
    # lxml is required for robust namespace handling.
    from lxml import etree
    print("--- lxml library successfully imported. Proceeding with robust parser. ---")
except ImportError:
    print("\nFATAL ERROR: The 'lxml' library is not installed.")
    print("This script requires lxml for robust XML namespace handling.")
    print("Please install it by running: pip install lxml\n")
    etree = None

def parse_amarakosha_definitive():
    """
    This is the final, correct, and robust parser.
    It uses the lxml library and an explicit XPath query with a namespace map
    to guarantee that all verse lines are found and processed correctly.
    """
    if not etree:
        return

    print(f"--- Starting Amarakosha XML parsing (Definitive Version) from: {INPUT_XML_FILE} ---")
    
    try:
        # Use lxml to parse the file
        tree = etree.parse(INPUT_XML_FILE)
        root = tree.getroot()
        
        # Define the namespace map. This is the key to robustly finding the tags.
        ns = {'tei': 'http://www.tei-c.org/ns/1.0'}
        
        thesaurus_map = {}
        
        # Regex to find valid Sanskrit words (IAST encoding)
        sanskrit_word_finder = re.compile(r'[a-zA-Zāīūṛṝḷḹṃḥśṣṭḍṇṅñ]+')
        stop_words = {'ca', 'vā', 'tu', 'hi', 'iti'}

        # Use findall with an XPath expression and the namespace map.
        # This is the guaranteed way to find all <l> tags.
        line_elements = root.findall('.//tei:l', namespaces=ns)
        
        if not line_elements:
            print("\nFATAL: No <l> elements found. The XPath query might be incorrect or the XML structure has changed.\n")
            return

        for line_element in line_elements:
            full_line_text = ''.join(line_element.itertext())
            
            if full_line_text and full_line_text.strip():
                words = sanskrit_word_finder.findall(full_line_text.lower())
                
                if len(words) > 1:
                    headword = words[0]
                    if headword and headword not in stop_words:
                        synonyms = words[1:]
                        for synonym in synonyms:
                            if synonym:
                                thesaurus_map[synonym] = headword
                        thesaurus_map[headword] = headword

        print(f"\n--- PARSING SUMMARY ---")
        print(f"Total <l> tags found and processed: {len(line_elements)}")
        print(f"Total unique word mappings created: {len(thesaurus_map)}")
        
        if len(thesaurus_map) < MINIMUM_WORD_MAPPINGS:
            print(f"\nWARNING: The number of mappings is below the threshold of {MINIMUM_WORD_MAPPINGS}.")
        else:
            print(f"\nSUCCESS: A rich thesaurus with over {MINIMUM_WORD_MAPPINGS} mappings has been created.")

        with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(thesaurus_map, f, indent=2, ensure_ascii=False)
            
        print(f"--- Successfully created definitive thesaurus at: {OUTPUT_JSON_FILE} ---")

    except FileNotFoundError:
        print(f"FATAL ERROR: Could not find the XML file at '{INPUT_XML_FILE}'.")
        print("Please ensure the file from GRETIL is in the '05_tagging_data' directory.")
    except Exception as e:
        print(f"An error occurred during XML parsing: {e}")

# --- Main execution block ---
if __name__ == '__main__':
    if etree:
        if not os.path.exists(TAGGING_DATA_DIR):
            print(f"Error: The '{TAGGING_DATA_DIR}' directory does not exist.")
        elif not os.path.exists(INPUT_XML_FILE):
            print(f"Error: The file '{INPUT_XML_FILE}' was not found in the '{TAGGING_DATA_DIR}' directory.")
        else:
            parse_amarakosha_definitive()
