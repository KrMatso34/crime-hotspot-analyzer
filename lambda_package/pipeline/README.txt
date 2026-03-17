Sprint 3 – ETL Pipeline

This pipeline is responsible for transferring data from raw storage to the database.

Scope:
- Input: CSV files produced by the data ingestion / raw storage workflow
- Output: MongoDB-ready JSONL and GeoJSON for frontend mapping

Responsibilities:
- Clean and normalize raw data
- Standardize timestamps, categories, and location fields
- Generate GeoJSON-compatible output for map rendering
- Prepare documents for insertion into MongoDB

Run (local mode):
pip install pandas
python pipeline/run_pipeline.py <csv1> <csv2>

Notes:
AWS/S3 configuration is intentionally left blank in this sprint.
The pipeline is designed to plug into S3 once shared AWS infrastructure is finalized.
