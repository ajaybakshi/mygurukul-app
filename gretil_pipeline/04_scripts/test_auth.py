import google.generativeai as genai
import os

# Use your API key or credentials (from llm_tagger.py)
genai.configure(api_key=os.environ.get('API_KEY'))  # Or your setup

model = genai.GenerativeModel('gemini-2.5-pro')  # Your model
try:
    response = model.generate_content("Test prompt")
    print("Success! Response:", response.text)
except Exception as e:
    print("Error:", e)
