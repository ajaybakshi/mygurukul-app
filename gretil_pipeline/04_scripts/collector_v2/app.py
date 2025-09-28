# --- Step 1: Robust Path and Module Setup ---
import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# --- Step 2: Load Environment Variables Correctly ---
from dotenv import load_dotenv

# CORRECTED PATH: Go up THREE levels from 'collector_v2' to get to 'mygurukul-app'
project_root = os.path.abspath(os.path.join(script_dir, '..', '..', '..'))
dotenv_path = os.path.join(project_root, '.env.local')

print(f"Attempting to load environment variables from: {dotenv_path}")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print("Successfully loaded .env.local file.")
else:
    print("Warning: .env.local file not found.")

# --- Step 3: Import and Run the Application ---
from flask import Flask, request, jsonify
from collector_service_v2 import CollectorServiceV2

app = Flask(__name__)

try:
    collector_v2 = CollectorServiceV2()
except Exception as e:
    print(f"FATAL: Could not initialize CollectorServiceV2. Error: {e}")
    collector_v2 = None

@app.route('/collect', methods=['POST'])
def handle_collect():
    if not collector_v2:
        return jsonify({"error": "Collector service is not available."}), 500
    data = request.get_json()
    question = data.get('question')
    if not question:
        return jsonify({"error": "Missing 'question' in request body."}), 400
    try:
        final_response = collector_v2.collect(question, data.get('sessionId', 'api-session'))
        return jsonify(final_response)
    except Exception as e:
        print(f"ERROR during collection: {str(e)}")
        return jsonify({"error": "An internal error occurred."}), 500

if __name__ == '__main__':
    print("Starting Flask API server for CollectorServiceV2 on port 5001...")
    app.run(port=5001, debug=True, use_reloader=False)
