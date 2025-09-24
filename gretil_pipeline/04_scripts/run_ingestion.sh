#!/bin/bash
set -e

echo "--- STAGE 1: UPLOADING VERSE TEXTS TO GCS ---"
gsutil -m rsync -r 02_processed_texts/ gs://mygurukul-sacred-texts-corpus/Processed_Documents/

echo ""
echo "--- STAGE 2: UPLOADING METADATA FILES TO GCS ---"
# This now syncs all metadata files, not just one.
gsutil -m rsync -r 03_metadata_output/ gs://mygurukul-sacred-texts-corpus/Metadata/

echo ""
echo "--- UPLOAD COMPLETE ---"
echo "You can now go to the Google Cloud Console and start the manual import."
echo "Choose the specific metadata file you wish to import (e.g., gs://mygurukul-sacred-texts-corpus/Metadata/Sivopanisad_metadata.jsonl)"

