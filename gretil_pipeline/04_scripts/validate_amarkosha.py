import os
from lxml import etree

# --- Configuration ---
TAGGING_DATA_DIR = "05_tagging_data"
INPUT_XML_FILE = os.path.join(TAGGING_DATA_DIR, "Amarkosha-copy.xml")
MINIMUM_EXPECTED_LINES = 1000 # A reasonable minimum for the full Amarkosha

def validate_xml_file():
    """
    A simple, focused utility to validate the integrity of the Amarkosha XML file
    by counting the number of verse (<l>) tags.
    """
    print("--- Starting Amarkosha XML File Validator ---")
    
    if not os.path.exists(INPUT_XML_FILE):
        print(f"\n[FATAL ERROR] File not found at: {INPUT_XML_FILE}")
        return

    try:
        # Use lxml to parse the file, as it's the most reliable
        tree = etree.parse(INPUT_XML_FILE)
        root = tree.getroot()
        
        # Define the namespace map
        ns = {'tei': 'http://www.tei-c.org/ns/1.0'}
        
        # Use the definitive XPath query to find all <l> tags
        line_elements = root.findall('.//tei:l', namespaces=ns)
        line_count = len(line_elements)
        
        print(f"\n[DIAGNOSTIC RESULT] Found {line_count} verse (<l>) tags in the file.")
        
        if line_count > MINIMUM_EXPECTED_LINES:
            print(f"\n[VALIDATION PASSED] The file appears to be complete.")
        else:
            print(f"\n[VALIDATION FAILED] The file is incomplete or corrupt.")
            print(f"A complete file should have over {MINIMUM_EXPECTED_LINES} verse lines, but yours has only {line_count}.")
            print("Please replace this file with the full, original version of Amarkosha-copy.xml.")

    except etree.XMLSyntaxError as e:
        print(f"\n[FATAL ERROR] The file is not valid XML. It cannot be parsed.")
        print(f"Error details: {e}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == '__main__':
    validate_xml_file()
