# Unit tests verifying the static JSON datasets load cleanly and compute expected metrics.
from app.tools.functions import (
    calculate_metric,
    describe_table,
    list_tables,
    query_table,
)


def test_real_dataset_tables_exist() -> None:
    tables = list_tables()
    expected = ["customers", "revenue_events", "subscriptions", "support_tickets", "usage"]
    assert set(expected).issubset(set(tables))


def test_describe_all_tables() -> None:
    tables = list_tables()
    for table_name in tables:
        desc = describe_table(table_name)
        assert desc["total_rows"] > 0
        assert len(desc["columns"]) > 0
        assert len(desc["sample_rows"]) > 0


def test_real_data_mrr_and_arr() -> None:
    total_mrr = calculate_metric("total_mrr")
    assert isinstance(total_mrr, float)
    assert total_mrr > 0.0

    total_arr = calculate_metric("total_arr")
    assert isinstance(total_arr, float)
    assert total_arr == round(total_mrr * 12.0, 2)


def test_real_data_high_risk_customers() -> None:
    high_risk = calculate_metric("high_risk_customers")
    assert isinstance(high_risk, list)
    assert len(high_risk) > 0
    for customer in high_risk:
        assert "customer_id" in customer
        assert "risk_factors" in customer
