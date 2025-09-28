import os
import json
import requests
import datetime
from google.cloud import storage
from google.auth.transport.requests import Request
from google.oauth2 import service_account

# We can now safely import from the sibling directory
from query_enhancer import QueryEnhancer

class CollectorServiceV2:
    def __init__(self):
        """Initializes the V2 collector service with robust, absolute paths."""
        print("--- Initializing CollectorServiceV2 ---")
        
        # --- Robust Pathing Logic ---
        # Get the directory where this script is located (04_scripts/collector_v2)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up two levels to get the root of the 'gretil_pipeline' project
        project_root = os.path.dirname(os.path.dirname(script_dir))
        
        # Build absolute paths to the assets from the project root
        amarakosha_path = os.path.join(project_root, "05_tagging_data", "amarakosha_thesaurus.json")
        tags_path = os.path.join(project_root, "master_conceptual_tags.json")
        index_path = os.path.join(project_root, "conceptual_tags.index")
        
        # Initialize the core components
        self.enhancer = QueryEnhancer(amarakosha_path, tags_path, index_path)
        self.storage_client = storage.Client(project="gurukul-468712")
        self.gcs_bucket_name = os.environ.get("GCS_BUCKET_NAME", "mygurukul-sacred-texts-corpus")

    def _get_gcp_token(self):
        """Helper to get a fresh GCP auth token."""
        credentials = service_account.Credentials.from_service_account_file(
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'],
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        credentials.refresh(Request())
        return credentials.token

    def _query_discovery_engine(self, enhanced_query_object, session_id):
        """Queries Google's Discovery Engine with the enhanced query."""
        print(f"--- Querying Discovery Engine for session: {session_id} ---")
        api_endpoint = os.environ.get('GOOGLE_DISCOVERY_ENGINE_ENDPOINT')
        if not api_endpoint:
            raise ValueError("GOOGLE_DISCOVERY_ENGINE_ENDPOINT environment variable not set.")

        query_string = enhanced_query_object["final_query_string"]
        request_body = {"query": query_string, "pageSize": 20}
        if enhanced_query_object.get("scoping_filter"):
            request_body["filter"] = enhanced_query_object["scoping_filter"]
        
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self._get_gcp_token()}'}
        
        response = requests.post(api_endpoint, headers=headers, json=request_body)
        if not response.ok:
            raise Exception(f"Discovery Engine query failed: {response.status_code} {response.text}")
        
        print(f"  > Successfully received {len(response.json().get('results', []))} candidates from Discovery Engine.")
        return response.json()

    def _fetch_verses_from_gcs(self, results, session_id):
        """Fetches and formats the content of verses from GCS links."""
        print(f"--- Fetching {len(results)} verse contents from GCS for session: {session_id} ---")
        bucket = self.storage_client.bucket(self.gcs_bucket_name)
        verses = []
        for result in results:
            link = result.get("document", {}).get("derivedStructData", {}).get("link")
            if not link:
                continue
            
            file_path = link.replace(f"gs://{self.gcs_bucket_name}/", "")
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                print(f"  > Warning: File not found in GCS: {file_path}")
                continue

            content = blob.download_as_text()
            verses.append({
                "id": result.get("document", {}).get("derivedStructData", {}).get("title"),
                "content": content,
                "source": file_path
            })
        print(f"  > Successfully fetched content for {len(verses)} verses.")
        return verses

    def _format_for_synthesizer(self, original_query, enhanced_query_object, verses, session_id):
        """Formats the final response object exactly as the Synthesizer expects."""
        print("--- Formatting final response for Synthesizer ---")
        response = {
            "sessionId": session_id,
            "query": {
                "original": original_query,
                "enhanced_query_object": enhanced_query_object
            },
            "results": {
                "totalVerses": len(verses),
                "verses": verses
            },
            "metadata": {
                "collectionTime": datetime.datetime.now().isoformat(),
                "collectorVersion": "v2.0-python"
            }
        }
        print("  > Final response object created successfully.")
        return response

    def collect(self, question, session_id):
        """Main method to process a user's question and collect verses."""
        enhanced_query_object = self.enhancer.enhance(question)
        discovery_response = self._query_discovery_engine(enhanced_query_object, session_id)
        top_5_candidates = discovery_response.get("results", [])[:5]
        verses_with_content = self._fetch_verses_from_gcs(top_5_candidates, session_id)
        final_output = self._format_for_synthesizer(question, enhanced_query_object, verses_with_content, session_id)
        return final_output
