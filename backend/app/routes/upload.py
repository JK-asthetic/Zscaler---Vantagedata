# Upload and table preview routes operating on the in-memory TableRegistry.
from typing import Any
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.storage.ingest import ingest_file
from app.storage.registry import registry

router = APIRouter(prefix="/api", tags=["tables"])


class TableSummaryItem(BaseModel):
    name: str
    rows: int
    columns: list[str]


class TablesListResponse(BaseModel):
    tables: list[str]
    summary: list[TableSummaryItem]


class TablePreviewResponse(BaseModel):
    table_name: str
    rows: int
    columns: list[str]
    dtypes: dict[str, str]
    preview: list[dict[str, Any]]


class TableUploadResponse(BaseModel):
    table_name: str
    rows: int
    columns: list[str]
    dtypes: dict[str, str]
    preview: list[dict[str, Any]]
    message: str


@router.post("/upload", response_model=TableUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_table(file: UploadFile = File(...)) -> TableUploadResponse:
    try:
        df = await ingest_file(file)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as general_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed unexpectedly: {str(general_err)}",
        )

    raw_filename = file.filename or "uploaded_table"
    table_name = raw_filename.rsplit(".", 1)[0].strip().lower().replace(" ", "_").replace("-", "_")

    registry.register(table_name, df)

    preview_records: list[dict[str, Any]] = df.head(10).to_dict(orient="records")

    return TableUploadResponse(
        table_name=table_name,
        rows=len(df),
        columns=list(df.columns),
        dtypes={str(col): str(dtype) for col, dtype in df.dtypes.items()},
        preview=preview_records,
        message=f"Successfully registered table '{table_name}' with {len(df):,} rows and {len(df.columns)} columns.",
    )


@router.get("/tables", response_model=TablesListResponse)
def list_registered_tables() -> TablesListResponse:
    names = registry.list_names()
    summary: list[TableSummaryItem] = []
    for name in names:
        try:
            df = registry.get(name)
            summary.append(TableSummaryItem(name=name, rows=len(df), columns=list(df.columns)))
        except KeyError:
            continue
    return TablesListResponse(tables=names, summary=summary)


@router.get("/tables/{name}/preview", response_model=TablePreviewResponse)
def preview_table(name: str, limit: int = 50) -> TablePreviewResponse:
    try:
        df = registry.get(name)
    except KeyError as key_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(key_err))

    clean_preview: list[dict[str, Any]] = df.head(limit).to_dict(orient="records")
    return TablePreviewResponse(
        table_name=name,
        rows=len(df),
        columns=list(df.columns),
        dtypes={str(col): str(dtype) for col, dtype in df.dtypes.items()},
        preview=clean_preview,
    )
