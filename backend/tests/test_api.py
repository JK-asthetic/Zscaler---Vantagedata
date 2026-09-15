# Unit tests for FastAPI HTTP routes and error handling.
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-data-analyst-backend"}


def test_chat_empty_body_fails_validation() -> None:
    response = client.post("/api/chat", json={})
    assert response.status_code == 422


def test_chat_empty_message_fails_validation() -> None:
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422


def test_list_tables_endpoint() -> None:
    response = client.get("/api/tables")
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert "summary" in data
    assert "customers" in data["tables"]
    assert "subscriptions" in data["tables"]


def test_preview_existing_table() -> None:
    response = client.get("/api/tables/customers/preview?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert data["table_name"] == "customers"
    assert len(data["preview"]) == 2
    assert "columns" in data
    assert "dtypes" in data


def test_preview_nonexistent_table_returns_404() -> None:
    response = client.get("/api/tables/non_existent_table_xyz/preview")
    assert response.status_code == 404


def test_upload_csv_table_success() -> None:
    csv_content = b"customer_id,name,churn_score\nC-101,Acme Corp,12\nC-102,Beta Inc,88\n"
    response = client.post(
        "/api/upload",
        files={"file": ("test_cohort.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["table_name"] == "test_cohort"
    assert data["rows"] == 2
    assert "churn_score" in data["columns"]
    assert len(data["preview"]) == 2

    # Verify newly uploaded table is listed in registry
    list_resp = client.get("/api/tables")
    assert "test_cohort" in list_resp.json()["tables"]

    # Verify preview works on newly uploaded table
    prev_resp = client.get("/api/tables/test_cohort/preview")
    assert prev_resp.status_code == 200
    assert prev_resp.json()["rows"] == 2


def test_upload_invalid_file_extension_fails() -> None:
    response = client.post(
        "/api/upload",
        files={"file": ("invalid_file.exe", b"malicious data", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported format" in response.json()["detail"]


def test_dynamic_table_registry_in_system_prompt_and_tools() -> None:
    from app.agent.prompts import get_system_prompt
    from app.storage.registry import registry
    from app.tools.functions import describe_table, compute_generic_aggregation, compute_group_by

    # Upload a dynamic custom table
    csv_bytes = b"dept,employee,salary\nSales,Alice,90000\nSales,Bob,110000\nEng,Charlie,150000\n"
    res = client.post("/api/upload", files={"file": ("dept_payroll.csv", csv_bytes, "text/csv")})
    assert res.status_code == 201

    # Verify dynamic registry reflection
    names = registry.list_names()
    assert "dept_payroll" in names

    # Verify system prompt dynamically includes the custom table and columns
    table_details = [
        {"name": n, "rows": len(registry.get(n)), "columns": list(registry.get(n).columns)}
        for n in names
    ]
    prompt = get_system_prompt(registered_tables=names, table_details=table_details)
    assert "dept_payroll" in prompt
    assert "salary" in prompt
    assert "[User Uploaded]" in prompt

    # Verify generic analytical tools execute on the custom uploaded table
    desc = describe_table("dept_payroll")
    assert desc["total_rows"] == 3
    assert "salary" in desc["columns"]

    total_sal = compute_generic_aggregation(table_name="dept_payroll", column_name="salary", agg_type="sum")
    assert total_sal == 350000.0

    grouped = compute_group_by(table_name="dept_payroll", group_by="dept", agg_column="salary", agg_func="sum")
    assert grouped["groups"]["Sales"] == 200000.0
    assert grouped["groups"]["Eng"] == 150000.0

