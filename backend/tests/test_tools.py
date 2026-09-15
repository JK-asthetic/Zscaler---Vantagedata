# Unit tests for pure data analyst tool functions.
import pytest
from app.tools.functions import (
    calculate_metric,
    describe_table,
    generate_chart,
    join_tables,
    list_tables,
    query_table,
)

MOCK_DATASET = {
    "customers": [
        {"customer_id": "C-1", "name": "Alpha Corp", "feature_adoption_score": 40},
        {"customer_id": "C-2", "name": "Beta LLC", "feature_adoption_score": 85},
    ],
    "subscriptions": [
        {"subscription_id": "S-1", "customer_id": "C-1", "plan_tier": "Pro", "status": "active", "monthly_recurring_revenue": 2000.0},
        {"subscription_id": "S-2", "customer_id": "C-2", "plan_tier": "Enterprise", "status": "active", "monthly_recurring_revenue": 5000.0},
        {"subscription_id": "S-3", "customer_id": "C-3", "plan_tier": "Pro", "status": "cancelled", "monthly_recurring_revenue": 0.0},
    ],
    "usage": [
        {"usage_id": "U-1", "customer_id": "C-1", "month": "2024-01", "active_users": 50},
        {"usage_id": "U-2", "customer_id": "C-1", "month": "2024-02", "active_users": 20},
        {"usage_id": "U-3", "customer_id": "C-2", "month": "2024-01", "active_users": 100},
        {"usage_id": "U-4", "customer_id": "C-2", "month": "2024-02", "active_users": 110},
    ],
    "support_tickets": [
        {"ticket_id": "T-1", "customer_id": "C-1", "priority": "high", "status": "open"},
        {"ticket_id": "T-2", "customer_id": "C-2", "priority": "low", "status": "resolved"},
    ],
    "revenue_events": [
        {"event_id": "R-1", "customer_id": "C-1", "event_type": "new_business", "amount": 2000.0},
        {"event_id": "R-2", "customer_id": "C-2", "event_type": "new_business", "amount": 5000.0},
        {"event_id": "R-3", "customer_id": "C-3", "event_type": "churn", "amount": -1500.0},
    ],
}


def test_list_tables() -> None:
    tables = list_tables(dataset=MOCK_DATASET)
    assert tables == ["customers", "revenue_events", "subscriptions", "support_tickets", "usage"]


def test_describe_table() -> None:
    desc = describe_table("customers", dataset=MOCK_DATASET)
    assert desc["table_name"] == "customers"
    assert desc["total_rows"] == 2
    assert "feature_adoption_score" in desc["columns"]
    assert len(desc["sample_rows"]) == 2


def test_query_table_with_equality_and_operator() -> None:
    pro_subs = query_table("subscriptions", filters={"plan_tier": "Pro"}, dataset=MOCK_DATASET)
    assert pro_subs["returned"] == 2
    assert len(pro_subs["rows"]) == 2

    low_adoption = query_table(
        "customers",
        filters={"feature_adoption_score": {"lt": 50}},
        dataset=MOCK_DATASET,
    )
    assert low_adoption["returned"] == 1
    assert low_adoption["rows"][0]["customer_id"] == "C-1"


def test_query_table_sorting_and_limit() -> None:
    sorted_rows = query_table(
        "customers",
        sort_by="feature_adoption_score",
        ascending=False,
        limit=1,
        dataset=MOCK_DATASET,
    )
    assert sorted_rows["returned"] == 1
    assert sorted_rows["total_matched"] == 2
    assert sorted_rows["truncated"] is True
    assert sorted_rows["rows"][0]["customer_id"] == "C-2"


def test_join_tables_inner() -> None:
    joined = join_tables("customers", "subscriptions", key="customer_id", dataset=MOCK_DATASET)
    assert joined["returned"] == 2
    assert len(joined["rows"]) == 2
    for row in joined["rows"]:
        assert "name" in row
        assert "plan_tier" in row


def test_calculate_metric_mrr_and_arr() -> None:
    mrr = calculate_metric("total_mrr", dataset=MOCK_DATASET)
    assert mrr == 7000.0
    arr = calculate_metric("total_arr", dataset=MOCK_DATASET)
    assert arr == 84000.0


def test_calculate_metric_high_risk_customers() -> None:
    high_risk = calculate_metric("high_risk_customers", dataset=MOCK_DATASET)
    assert isinstance(high_risk, list)
    assert len(high_risk) == 1
    assert high_risk[0]["customer_id"] == "C-1"
    assert high_risk[0]["risk_level"] == "critical"


def test_calculate_metric_generic_aggregation() -> None:
    total_val = calculate_metric(
        "sum",
        params={"table": "subscriptions", "column": "monthly_recurring_revenue", "filters": {"status": "active"}},
        dataset=MOCK_DATASET,
    )
    assert total_val == 7000.0


def test_query_table_with_columns_projection() -> None:
    res = query_table("customers", columns=["name"], dataset=MOCK_DATASET)
    assert res["returned"] == 2
    assert list(res["rows"][0].keys()) == ["name"]


def test_calculate_metric_group_by() -> None:
    grouped = calculate_metric(
        "group_by",
        params={"table": "subscriptions", "group_by": "plan_tier", "agg_column": "monthly_recurring_revenue", "agg_func": "sum"},
        dataset=MOCK_DATASET,
    )
    assert isinstance(grouped, dict)
    assert grouped["table"] == "subscriptions"
    assert grouped["groups"]["Enterprise"] == 5000.0
    assert grouped["groups"]["Pro"] == 2000.0


def test_calculate_metric_value_counts() -> None:
    vc = calculate_metric(
        "value_counts",
        params={"table": "subscriptions", "column": "plan_tier"},
        dataset=MOCK_DATASET,
    )
    assert isinstance(vc, dict)
    assert vc["top_frequencies"]["Pro"] == 2
    assert vc["top_frequencies"]["Enterprise"] == 1


def test_calculate_metric_summary_statistics() -> None:
    stats = calculate_metric(
        "summary_statistics",
        params={"table": "customers"},
        dataset=MOCK_DATASET,
    )
    assert isinstance(stats, dict)
    assert stats["total_rows"] == 2
    assert "feature_adoption_score" in stats["column_summaries"]
    score_stat = stats["column_summaries"]["feature_adoption_score"]
    assert score_stat["type"] == "numeric"
    assert score_stat["min"] == 40.0
    assert score_stat["max"] == 85.0


def test_generate_chart() -> None:
    res = generate_chart(
        chart_type="pie",
        title="Customers by Industry",
        data=[
            {"label": "Technology", "value": 2},
            {"label": "Healthcare", "value": 1},
        ],
        table_name="customers",
    )
    assert res["status"] == "success"
    assert res["chart_spec"]["type"] == "pie"
    assert len(res["chart_spec"]["data"]) == 2
    assert res["chart_spec"]["data"][0]["percentage"] == 66.67
    assert "```chart" in res["markdown_snippet"]


def test_invalid_table_name_fails_loudly() -> None:
    with pytest.raises(KeyError):
        query_table("non_existent_table", dataset=MOCK_DATASET)

