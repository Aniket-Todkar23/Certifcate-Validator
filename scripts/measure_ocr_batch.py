#!/usr/bin/env python3

"""
Measure OCR Verification Time for Batch Documents
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import csv
import time
from backend.ocr_processor import OCRProcessor

# Path to CSV listing document file paths (update as needed)
CSV_PATH = '../data/test_bulk_upload_fixed.csv'
# Path to folder containing certificate images/PDFs (update as needed)
DOCS_FOLDER = '../uploads/'

ocr = OCRProcessor()


def get_document_paths_sequential(docs_folder, limit=1000):
    paths = []
    for i in range(1, limit + 1):
        file_name = f"ANiket{i}.pdf"
        file_path = os.path.join(docs_folder, file_name)
        if os.path.exists(file_path):
            paths.append(file_path)
    return paths

def main():

    doc_paths = get_document_paths_sequential(DOCS_FOLDER, limit=1000)
    print(f"Found {len(doc_paths)} document files for OCR batch.")
    start_time = time.time()
    for i, doc_path in enumerate(doc_paths):
        print(f"[{i+1}/{len(doc_paths)}] Verifying: {os.path.basename(doc_path)} ...", end=' ')
        try:
            raw_text, structured = ocr.process_document(doc_path)
            print("OK")
        except Exception as e:
            print(f"ERROR: {e}")
    end_time = time.time()
    elapsed = end_time - start_time
    print(f"\nTime taken to verify {len(doc_paths)} documents: {elapsed:.2f} seconds")

if __name__ == '__main__':
    main()
