#!/usr/bin/env python3
"""
Measure OCR Verification Time for Batch Image Documents (PNG)
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import time
from backend.ocr_processor import OCRProcessor

# Path to folder containing certificate images (update as needed)
DOCS_FOLDER = '../uploads/'

ocr = OCRProcessor()

def get_image_paths_sequential(docs_folder, limit=100):
    paths = []
    for i in range(1, limit + 1):
        file_name = f"Sahil{i}.png"
        file_path = os.path.join(docs_folder, file_name)
        if os.path.exists(file_path):
            paths.append(file_path)
    return paths

def main():
    doc_paths = get_image_paths_sequential(DOCS_FOLDER, limit=100)
    print(f"Found {len(doc_paths)} image files for OCR batch.")
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
    print(f"\nTime taken to verify {len(doc_paths)} images: {elapsed:.2f} seconds")

if __name__ == '__main__':
    main()
