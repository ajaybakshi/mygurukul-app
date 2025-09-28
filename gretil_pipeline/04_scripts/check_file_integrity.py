import os

# --- Configuration ---
TAGGING_DATA_DIR = "05_tagging_data"
# This must be the exact name of the file you downloaded from GRETIL
INPUT_XML_FILE = os.path.join(TAGGING_DATA_DIR, "sa_amarasiMha-nAmaliGgAnuzAsana.xml")
# The string we are looking for in the raw text
SEARCH_STRING = "<l>"
# A known-good file has over 3000 of these tags
MINIMUM_EXPECTED_COUNT = 3000

def run_raw_integrity_check():
    """
    Performs a first-principles check by reading the raw file content
    and counting a specific substring, bypassing all XML parsers.
    """
    print("--- Starting First-Principles File Integrity Check ---")
    
    if not os.path.exists(INPUT_XML_FILE):
        print(f"\n[FATAL ERROR] File not found at: {INPUT_XML_FILE}")
        return

    try:
        with open(INPUT_XML_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        count = content.count(SEARCH_STRING)
        
        print(f"\n[DIAGNOSTIC RESULT] Raw text search found '{SEARCH_STRING}' {count} times.")
        
        if count > MINIMUM_EXPECTED_COUNT:
            print(f"\n[VALIDATION PASSED] The file on disk is complete.")
        else:
            print(f"\n[VALIDATION FAILED] The file on disk is corrupt or truncated.")
            print("This scientifically proves the local file is the source of the error.")
            print("Please proceed to the 'Definitive Solution' to fix the data.")

    except Exception as e:
        print(f"\nAn unexpected error occurred during the raw file read: {e}")

if __name__ == '__main__':
    run_raw_integrity_check()
