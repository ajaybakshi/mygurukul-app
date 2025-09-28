import google.generativeai as genai
import os
import json
import time

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY" with the key you copied.
# For better security, we will later move this to a secure environment variable.
API_KEY = "AIzaSyCKoquY723X95WtexHxh7e2VeM1vU_jMsA"
genai.configure(api_key=API_KEY)

# --- Caching to Avoid Wasting API Calls ---
# We will store the tags for each verse in a local file so we only have to
# generate them once.
CACHE_DIR = "06_llm_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def get_llm_tags_for_verse(verse_id, verse_text, scripture_category):
    """
    Generates semantic tags for a verse using the Gemini API, with caching.
    """
    cache_file_path = os.path.join(CACHE_DIR, f"{verse_id}_tags.json")

    # 1. Check if tags have already been generated and saved.
    if os.path.exists(cache_file_path):
        with open(cache_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    # 2. If not cached, generate a dynamic prompt based on the category.
    if "Arts" in scripture_category:
        expert_persona = "an expert in classical Indian arts, drama, and aesthetics"
    elif "Health" in scripture_category:
        expert_persona = "an expert in ancient Ayurvedic medicine and wellness"
    else: # Default to philosophy
        expert_persona = "an expert in Vedic philosophy and spiritual symbolism"

    prompt = (
        f"You are {expert_persona}. Read the following Sanskrit verse:\n\n"
        f"'{verse_text}'\n\n"
        "Provide a brief, one-sentence English translation. Then, on a new line, "
        "provide a comma-separated list of 15-20 insightful tags about its themes, "
        "concepts, symbolism, and user-intent keywords. "
        "Format the output as: Translation: [Your translation]. Tags: [tag1, tag2, ...]"
    )

    # 3. Call the Gemini API.
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        response = model.generate_content(prompt)
        
        # 4. Parse the response to extract the tags.
        # This is a simple parser; we can make it more robust if needed.
        tags_line = response.text.split("Tags:")[-1].strip()
        tags = [tag.strip() for tag in tags_line.split(',')]

        # 5. Save the generated tags to the cache file.
        with open(cache_file_path, 'w', encoding='utf-8') as f:
            json.dump(tags, f, ensure_ascii=False)
        
        # Add a small delay to respect API rate limits.
        time.sleep(1) 
        
        return tags

    except Exception as e:
        print(f"Error calling Gemini API for verse {verse_id}: {e}", file=sys.stderr)
        return [] # Return an empty list on error

# --- Example Usage (for testing this script directly) ---
if __name__ == '__main__':
    test_verse_id = "test_dharma_verse"
    test_verse_text = "[translate:धर्मो रक्षति रक्षितः]" # (dharmo rakṣati rakṣitaḥ)
    test_category = "Life Purpose & Ethics"
    
    print(f"Generating tags for test verse: '{test_verse_text}'...")
    generated_tags = get_llm_tags_for_verse(test_verse_id, test_verse_text, test_category)
    print("\nGenerated Tags:")
    print(generated_tags)
