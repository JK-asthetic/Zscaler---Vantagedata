# In-memory TableRegistry maintaining DataFrame representations of static JSON datasets and user uploads.
import json
from pathlib import Path
from typing import Any
import pandas as pd


class TableRegistry:
    def __init__(self) -> None:
        self._tables: dict[str, pd.DataFrame] = {}

    def register(self, name: str, df: pd.DataFrame) -> None:
        clean_name = name.strip().lower().replace(" ", "_")
        # Ensure column names are standardized
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
        self._tables[clean_name] = df

    def get(self, name: str) -> pd.DataFrame:
        clean_name = name.strip().lower().replace(" ", "_")
        if clean_name not in self._tables:
            available = self.list_names()
            raise KeyError(f"Table '{name}' not found in registry. Available tables: {available}")
        return self._tables[clean_name]

    def has_table(self, name: str) -> bool:
        clean_name = name.strip().lower().replace(" ", "_")
        return clean_name in self._tables

    def list_names(self) -> list[str]:
        return sorted(list(self._tables.keys()))

    def load_defaults(self, data_dir: Path | None = None) -> None:
        target_dir = data_dir or (Path(__file__).resolve().parent.parent / "data")
        if not target_dir.exists():
            return
        for json_file in target_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    records = json.load(f)
                if isinstance(records, list):
                    df = pd.DataFrame(records)
                    self.register(json_file.stem, df)
            except Exception as e:
                print(f"Warning: Failed to load default table {json_file.name}: {e}")


registry = TableRegistry()
registry.load_defaults()
