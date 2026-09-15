# Ingest pipeline parsing, validating, and sanitizing CSV/XLSX/JSON uploads into pandas DataFrames.
import io
import json
from typing import Any
import pandas as pd
from fastapi import UploadFile

MAX_ROWS = 50_000
MAX_FILE_MB = 10


async def ingest_file(file: UploadFile) -> pd.DataFrame:
    content: bytes = await file.read()
    if len(content) > MAX_FILE_MB * 1024 * 1024:
        raise ValueError(f"File exceeds maximum allowed size of {MAX_FILE_MB}MB")

    filename = (file.filename or "uploaded_table.csv").lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith(".json"):
            records = json.loads(content.decode("utf-8"))
            if not isinstance(records, list):
                raise ValueError("JSON file must contain a list of records")
            df = pd.DataFrame(records)
        else:
            raise ValueError("Unsupported format. Only .csv, .xlsx, .xls, and .json files are supported")
    except Exception as parse_err:
        raise ValueError(f"Failed to parse table file: {str(parse_err)}")

    if len(df) > MAX_ROWS:
        raise ValueError(f"File exceeds maximum row limit of {MAX_ROWS:,} rows (found {len(df):,} rows)")

    # Standardize column headers
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    # Replace NaN / NaT values with None for clean JSON serialization
    df = df.where(pd.notnull(df), None)

    return df
