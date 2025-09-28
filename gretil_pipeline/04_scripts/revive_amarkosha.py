import os
import re
import json
from lxml import etree

# Configuration
TAGGING_DATA_DIR = "05_tagging_data"
INPUT_XML_FILE = os.path.join(TAGGING_DATA_DIR, "sa_amarasiMha-nAmaliGgAnuzAsana.xml")
REVIVED_XML_FILE = os.path.join(TAGGING_DATA_DIR, "revived_amarkosha.xml")
OUTPUT_JSON_FILE = os.path.join(TAGGING_DATA_DIR, "amarakosha_thesaurus.json")
LOG_FILE = os.path.join(TAGGING_DATA_DIR, "revival_log.txt")

def log_message(message, file=LOG_FILE):
    with open(file, 'a', encoding='utf-8') as f:
        f.write(message + '\n')
    print(message)

def revive_xml():
    log_message("--- Starting XML Revival Process ---")

    # Step 1: Initial Inspection
    with open(INPUT_XML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    log_message(f"File size: {len(content)} characters (expected ~200,000+ for full file)")
    log_message(f"Sample start: {content[:200]}...")

    # Step 2: Relaxed Parsing and Repair
    try:
        parser = etree.XMLParser(recover=True, remove_blank_text=True)
        tree = etree.parse(INPUT_XML_FILE, parser)
        log_message("XML parsed with recovery mode.")
    except etree.XMLSyntaxError as e:
        log_message(f"Parsing failed: {e}. Falling back to text repair.")
        # Preprocess: Normalize lines, fix potential tag issues
        content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
        content = re.sub(r'<\?xml.*?\?>', '', content)  # Remove any bad declarations
        content = '<root>' + content + '</root>'  # Force a root if missing
        tree = etree.fromstring(content, parser)

    # Save revived XML
    tree.getroot().getroottree().write(REVIVED_XML_FILE, encoding='utf-8', pretty_print=True)
    log_message(f"Revived XML saved to {REVIVED_XML_FILE}")

    # Step 3: Extract Namespaces and Tags
    namespaces = tree.getroot().nsmap
    log_message(f"Namespaces found: {namespaces}")
    all_tags = set(elem.tag for elem in tree.iter())
    log_message(f"Unique tags: {all_tags}")

    # Step 4: Data Extraction (Hybrid XML + Regex)
    thesaurus = {}
    stop_words = {'ca', 'vā', 'tu', 'hi', 'iti'}
    word_finder = re.compile(r'[a-zA-Zāīūṛṝḷḹṃḥśṣṭḍṇṅñ]+')
    verse_pattern = re.compile(r'\(\d+\.\d+\.\d+\)\s*(.+?)(?=\(\d+\.\d+\.\d+\)|$)', re.DOTALL)  # Match numbered verses

    # Try XML extraction first
    ns = {'tei': 'http://www.tei-c.org/ns/1.0'}
    l_tags = tree.findall('.//tei:l', ns)
    log_message(f"Found {len(l_tags)} <l> tags in revived XML.")

    for tag in l_tags:
        text = ''.join(tag.itertext()).strip().lower()
        words = word_finder.findall(text)
        if len(words) > 1 and words[0] not in stop_words:
            headword = words[0]
            for synonym in words[1:]:
                thesaurus[synonym] = headword
            thesaurus[headword] = headword

    # Fallback to regex if XML yield is low
    if len(l_tags) < 1000:
        log_message("XML yield low. Falling back to regex verse extraction.")
        verses = verse_pattern.findall(content)
        log_message(f"Found {len(verses)} potential verses via regex.")
        for verse in verses:
            words = word_finder.findall(verse.lower())
            if len(words) > 1 and words[0] not in stop_words:
                headword = words[0]
                for synonym in words[1:]:
                    thesaurus[synonym] = headword
                thesaurus[headword] = headword

    # Step 5: Save Thesaurus
    with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(thesaurus, f, ensure_ascii=False, indent=4)
    log_message(f"Thesaurus saved to {OUTPUT_JSON_FILE} with {len(thesaurus)} entries.")

    log_message("--- Revival Complete ---")

if __name__ == '__main__':
    revive_xml()
