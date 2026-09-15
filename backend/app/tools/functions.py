# Schema-driven, token-efficient data analysis tools operating on the dynamic TableRegistry.
from typing import Any
import pandas as pd

from app.storage.registry import registry


def get_table_dataframe(
    table_name: str,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> pd.DataFrame:
    clean_name = table_name.strip().lower().replace(" ", "_")
    if dataset is not None:
        if clean_name not in dataset:
            raise KeyError(f"Table '{table_name}' not found in provided dataset. Available: {list(dataset.keys())}")
        df = pd.DataFrame(dataset[clean_name])
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
        return df
    return registry.get(clean_name)


def list_tables(dataset: dict[str, list[dict[str, Any]]] | None = None) -> list[str]:
    if dataset is not None:
        return sorted(list(dataset.keys()))
    return registry.list_names()


def describe_table(
    table_name: str,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df = get_table_dataframe(table_name, dataset)
    # Token-efficiency rule: sample is capped at 3 rows always
    sample_records = df.head(3).where(pd.notnull(df), None).to_dict(orient="records")
    return {
        "table_name": table_name,
        "columns": list(df.columns),
        "dtypes": {str(c): str(t) for c, t in df.dtypes.items()},
        "total_rows": len(df),
        "row_count": len(df),
        "sample_rows": sample_records,
        "sample": sample_records,
    }


def apply_single_condition(df: pd.DataFrame, col: str, op: str, value: Any) -> pd.DataFrame:
    if op == "eq":
        return df[df[col] == value]
    if op == "neq":
        return df[df[col] != value]
    if op == "gt":
        return df[df[col] > value]
    if op == "gte":
        return df[df[col] >= value]
    if op == "lt":
        return df[df[col] < value]
    if op == "lte":
        return df[df[col] <= value]
    if op == "contains":
        return df[df[col].astype(str).str.contains(str(value), case=False, na=False)]
    if op == "in":
        return df[df[col].isin(value)]
    raise ValueError(f"Unsupported filter operator '{op}'")


def apply_dataframe_filters(df: pd.DataFrame, filters: dict[str, Any] | None) -> pd.DataFrame:
    if not filters:
        return df

    filtered_df = df
    for col, condition in filters.items():
        if col not in filtered_df.columns:
            continue

        if isinstance(condition, dict) and "op" in condition and "value" in condition:
            filtered_df = apply_single_condition(filtered_df, col, condition["op"], condition["value"])
        elif isinstance(condition, dict):
            for op, val in condition.items():
                filtered_df = apply_single_condition(filtered_df, col, op, val)
        else:
            filtered_df = filtered_df[filtered_df[col] == condition]

    return filtered_df


def query_table(
    table_name: str,
    filters: dict[str, Any] | None = None,
    columns: list[str] | None = None,
    sort_by: str | None = None,
    ascending: bool = True,
    limit: int = 50,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df = get_table_dataframe(table_name, dataset)
    filtered_df = apply_dataframe_filters(df, filters)

    if sort_by and sort_by in filtered_df.columns:
        filtered_df = filtered_df.sort_values(by=sort_by, ascending=ascending)

    if columns:
        clean_cols = [c.strip().lower().replace(" ", "_") for c in columns]
        valid_cols = [c for c in clean_cols if c in filtered_df.columns]
        if valid_cols:
            filtered_df = filtered_df[valid_cols]

    total_matched = len(filtered_df)
    clean_df = filtered_df.where(pd.notnull(filtered_df), None)
    result_records = clean_df.head(limit).to_dict(orient="records")

    return {
        "rows": result_records,
        "returned": len(result_records),
        "total_matched": total_matched,
        "truncated": total_matched > limit,
    }


def join_tables(
    table_a: str,
    table_b: str,
    key: str,
    join_type: str = "inner",
    limit: int = 50,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df_a = get_table_dataframe(table_a, dataset)
    df_b = get_table_dataframe(table_b, dataset)

    if key not in df_a.columns:
        raise KeyError(f"Key '{key}' not found in table '{table_a}' (available: {list(df_a.columns)})")
    if key not in df_b.columns:
        raise KeyError(f"Key '{key}' not found in table '{table_b}' (available: {list(df_b.columns)})")

    how = "inner" if join_type.lower() == "inner" else "left"
    merged = pd.merge(df_a, df_b, on=key, how=how, suffixes=("", f"_{table_b}"))
    total_matched = len(merged)

    clean_merged = merged.where(pd.notnull(merged), None)
    result_records = clean_merged.head(limit).to_dict(orient="records")

    return {
        "rows": result_records,
        "returned": len(result_records),
        "total_matched": total_matched,
        "truncated": total_matched > limit,
    }


def compute_total_mrr(dataset: dict[str, list[dict[str, Any]]] | None = None) -> float:
    df = get_table_dataframe("subscriptions", dataset)
    mrr_col = "mrr" if "mrr" in df.columns else "monthly_recurring_revenue"
    if "status" in df.columns and mrr_col in df.columns:
        active = df[df["status"].astype(str).str.lower() == "active"]
        return round(float(active[mrr_col].sum()), 2)
    return 0.0


def compute_total_arr(dataset: dict[str, list[dict[str, Any]]] | None = None) -> float:
    mrr = compute_total_mrr(dataset)
    return round(mrr * 12.0, 2)


def compute_average_adoption_score(dataset: dict[str, list[dict[str, Any]]] | None = None) -> float:
    try:
        df_usage = get_table_dataframe("usage", dataset)
        if "feature_adoption_score" in df_usage.columns:
            return round(float(df_usage["feature_adoption_score"].mean()), 2)
    except Exception:
        pass
    df = get_table_dataframe("customers", dataset)
    if "feature_adoption_score" in df.columns:
        return round(float(df["feature_adoption_score"].mean()), 2)
    return 0.0


def compute_mrr_by_tier(dataset: dict[str, list[dict[str, Any]]] | None = None) -> dict[str, float]:
    df = get_table_dataframe("subscriptions", dataset)
    tier_col = "plan" if "plan" in df.columns else "plan_tier"
    mrr_col = "mrr" if "mrr" in df.columns else "monthly_recurring_revenue"
    if "status" in df.columns and tier_col in df.columns and mrr_col in df.columns:
        active = df[df["status"].astype(str).str.lower() == "active"]
        grouped = active.groupby(tier_col)[mrr_col].sum()
        return {str(tier): round(float(mrr), 2) for tier, mrr in grouped.items()}
    return {}


def compute_churn_summary(dataset: dict[str, list[dict[str, Any]]] | None = None) -> dict[str, Any]:
    subs_df = get_table_dataframe("subscriptions", dataset)
    rev_df = get_table_dataframe("revenue_events", dataset)

    total_subs = len(subs_df)
    cancelled = subs_df[subs_df["status"].astype(str).str.lower().isin(["cancelled", "churned"])] if "status" in subs_df.columns else pd.DataFrame()
    churn_rate = round(float(len(cancelled) / total_subs * 100), 2) if total_subs > 0 else 0.0

    churn_events = rev_df[rev_df["event_type"].astype(str).str.lower() == "churn"] if "event_type" in rev_df.columns else pd.DataFrame()
    churned_lost_amount = round(float(churn_events["amount"].abs().sum()), 2) if "amount" in churn_events.columns else 0.0

    return {
        "cancelled_subscriptions_count": len(cancelled),
        "total_subscriptions_count": total_subs,
        "churn_rate_percentage": churn_rate,
        "churned_lost_amount": churned_lost_amount,
    }


def find_high_risk_customers(dataset: dict[str, list[dict[str, Any]]] | None = None) -> list[dict[str, Any]]:
    cust_df = get_table_dataframe("customers", dataset)
    usage_df = get_table_dataframe("usage", dataset)
    ticket_df = get_table_dataframe("support_tickets", dataset)
    subs_df = pd.DataFrame()
    try:
        subs_df = get_table_dataframe("subscriptions", dataset)
    except Exception:
        pass

    open_high_tickets: dict[str, list[str]] = {}
    if "customer_id" in ticket_df.columns and "priority" in ticket_df.columns and "status" in ticket_df.columns:
        for _, t in ticket_df.iterrows():
            cid = str(t["customer_id"])
            prio = str(t.get("priority", "")).strip().lower()
            stat = str(t.get("status", "")).strip().lower()
            cat = str(t.get("category", "ticket"))
            if prio == "high" and stat == "open":
                open_high_tickets.setdefault(cid, []).append(cat)

    subs_status: dict[str, str] = {}
    subs_mrr: dict[str, float] = {}
    if not subs_df.empty and "customer_id" in subs_df.columns:
        mrr_col = "mrr" if "mrr" in subs_df.columns else "monthly_recurring_revenue"
        for _, s in subs_df.iterrows():
            cid = str(s["customer_id"])
            subs_status[cid] = str(s.get("status", "active"))
            subs_mrr[cid] = float(s.get(mrr_col, 0.0))

    jan_users: dict[str, int] = {}
    feb_users: dict[str, int] = {}
    jan_scores: dict[str, int] = {}
    feb_scores: dict[str, int] = {}
    if "customer_id" in usage_df.columns and "month" in usage_df.columns:
        jan_recs = usage_df[usage_df["month"] == "2024-01"]
        feb_recs = usage_df[usage_df["month"] == "2024-02"]
        if "active_users" in usage_df.columns:
            jan_users = {str(r["customer_id"]): int(r["active_users"]) for _, r in jan_recs.iterrows()}
            feb_users = {str(r["customer_id"]): int(r["active_users"]) for _, r in feb_recs.iterrows()}
        if "feature_adoption_score" in usage_df.columns:
            jan_scores = {str(r["customer_id"]): int(r["feature_adoption_score"]) for _, r in jan_recs.iterrows()}
            feb_scores = {str(r["customer_id"]): int(r["feature_adoption_score"]) for _, r in feb_recs.iterrows()}

    high_risk_list: list[dict[str, Any]] = []
    for _, cust in cust_df.iterrows():
        cid = str(cust["customer_id"])
        name = cust.get("customer_name", cust.get("name", cid))
        score = feb_scores.get(cid, int(cust.get("feature_adoption_score", 100)))
        tickets = open_high_tickets.get(cid, [])
        status = subs_status.get(cid, "active")
        mrr = subs_mrr.get(cid, 0.0)

        u_jan = jan_users.get(cid, 0)
        u_feb = feb_users.get(cid, 0)
        drop = (u_feb < u_jan) if (u_jan > 0 and u_feb > 0) else False

        s_jan = jan_scores.get(cid)
        s_feb = feb_scores.get(cid)
        score_drop = (s_feb is not None and s_jan is not None and s_feb < s_jan)

        risk_factors: list[str] = []
        if status.lower() in ("churned", "cancelled"):
            risk_factors.append(f"Subscription status is {status}")
        if score < 50:
            risk_factors.append(f"Low feature adoption score ({score} < 50)")
        if score_drop:
            risk_factors.append(f"Feature adoption score declined from {s_jan} to {s_feb}")
        if tickets:
            cats = ", ".join(tickets)
            risk_factors.append(f"High-priority open {cats} ticket")
        if drop:
            pct = round((u_jan - u_feb) / u_jan * 100, 1) if u_jan > 0 else 0.0
            risk_factors.append(f"Active users declined from {u_jan} to {u_feb} ({pct}% drop)")

        if risk_factors:
            high_risk_list.append({
                "customer_id": cid,
                "name": name,
                "status": status,
                "mrr": mrr,
                "feature_adoption_score": score,
                "risk_factors": risk_factors,
                "risk_level": "critical" if len(risk_factors) >= 2 or status.lower() == "churned" else "moderate",
            })

    return high_risk_list


def compute_generic_aggregation(
    table_name: str,
    column_name: str,
    agg_type: str,
    filters: dict[str, Any] | None = None,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> float | int:
    df = get_table_dataframe(table_name, dataset)
    filtered = apply_dataframe_filters(df, filters)

    if agg_type == "count":
        return len(filtered)
    clean_col = column_name.strip().lower().replace(" ", "_") if column_name else ""
    if not clean_col or clean_col not in filtered.columns:
        raise ValueError(f"Column '{column_name}' not found in table '{table_name}'. Available: {list(filtered.columns)}")

    series = pd.to_numeric(filtered[clean_col], errors="coerce").dropna()
    if series.empty:
        return 0

    if agg_type == "sum":
        return round(float(series.sum()), 2)
    if agg_type in ("avg", "average", "mean"):
        return round(float(series.mean()), 2)
    if agg_type == "min":
        return round(float(series.min()), 2)
    if agg_type == "max":
        return round(float(series.max()), 2)

    raise ValueError(f"Unsupported aggregation '{agg_type}'. Use count, sum, avg, min, or max.")


def compute_group_by(
    table_name: str,
    group_by: str,
    agg_column: str | None = None,
    agg_func: str = "count",
    filters: dict[str, Any] | None = None,
    sort_desc: bool = True,
    limit: int = 25,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df = get_table_dataframe(table_name, dataset)
    filtered = apply_dataframe_filters(df, filters)

    clean_group_by = group_by.strip().lower().replace(" ", "_")
    if clean_group_by not in filtered.columns:
        raise ValueError(f"Group-by column '{group_by}' not found in table '{table_name}'. Available: {list(filtered.columns)}")

    func = agg_func.lower().strip()
    if func == "count" or not agg_column:
        counts = filtered.groupby(clean_group_by).size()
        if sort_desc:
            counts = counts.sort_values(ascending=False)
        top = counts.head(limit)
        return {
            "table": table_name,
            "group_by": clean_group_by,
            "metric": "count",
            "total_groups": len(counts),
            "groups": {str(k): int(v) for k, v in top.items()},
        }

    clean_agg_col = agg_column.strip().lower().replace(" ", "_")
    if clean_agg_col not in filtered.columns:
        raise ValueError(f"Aggregation column '{agg_column}' not found in table '{table_name}'. Available: {list(filtered.columns)}")

    numeric_series = pd.to_numeric(filtered[clean_agg_col], errors="coerce")
    valid_mask = numeric_series.notnull()
    valid_df = filtered[valid_mask].copy()
    valid_df[clean_agg_col] = numeric_series[valid_mask]

    if func in ("sum", "total"):
        grouped = valid_df.groupby(clean_group_by)[clean_agg_col].sum()
    elif func in ("avg", "average", "mean"):
        grouped = valid_df.groupby(clean_group_by)[clean_agg_col].mean().round(2)
    elif func == "min":
        grouped = valid_df.groupby(clean_group_by)[clean_agg_col].min()
    elif func == "max":
        grouped = valid_df.groupby(clean_group_by)[clean_agg_col].max()
    else:
        raise ValueError(f"Unsupported aggregation function '{agg_func}'. Use count, sum, avg, min, or max.")

    if sort_desc:
        grouped = grouped.sort_values(ascending=False)
    top = grouped.head(limit)

    return {
        "table": table_name,
        "group_by": clean_group_by,
        "agg_column": clean_agg_col,
        "agg_func": func,
        "total_groups": len(grouped),
        "groups": {str(k): (int(v) if isinstance(v, (int, pd.Int64Dtype)) else round(float(v), 2)) for k, v in top.items()},
    }


def compute_value_counts(
    table_name: str,
    column_name: str,
    top_n: int = 15,
    filters: dict[str, Any] | None = None,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df = get_table_dataframe(table_name, dataset)
    filtered = apply_dataframe_filters(df, filters)

    clean_col = column_name.strip().lower().replace(" ", "_")
    if clean_col not in filtered.columns:
        raise ValueError(f"Column '{column_name}' not found in table '{table_name}'. Available: {list(filtered.columns)}")

    series = filtered[clean_col].dropna().astype(str)
    total_non_null = len(series)
    counts = series.value_counts()
    unique_count = len(counts)
    top_counts = counts.head(top_n)

    percentages = ((top_counts / total_non_null) * 100).round(2) if total_non_null > 0 else top_counts

    return {
        "table": table_name,
        "column": clean_col,
        "total_records": len(filtered),
        "non_null_records": total_non_null,
        "null_records": len(filtered) - total_non_null,
        "unique_count": unique_count,
        "top_frequencies": {str(k): int(v) for k, v in top_counts.items()},
        "percentages": {str(k): float(v) for k, v in percentages.items()},
    }


def compute_summary_statistics(
    table_name: str,
    column_name: str | None = None,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    df = get_table_dataframe(table_name, dataset)

    if column_name:
        clean_col = column_name.strip().lower().replace(" ", "_")
        if clean_col not in df.columns:
            raise ValueError(f"Column '{column_name}' not found in table '{table_name}'. Available: {list(df.columns)}")
        cols_to_check = [clean_col]
    else:
        cols_to_check = list(df.columns)

    stats: dict[str, Any] = {
        "table_name": table_name,
        "total_rows": len(df),
        "columns_analyzed": len(cols_to_check),
        "column_summaries": {},
    }

    for col in cols_to_check:
        series = df[col]
        null_count = int(series.isnull().sum())
        unique_count = int(series.nunique())

        numeric_vals = pd.to_numeric(series, errors="coerce").dropna()
        is_numeric = len(numeric_vals) > (len(series) * 0.5) and len(numeric_vals) > 0

        if is_numeric:
            stats["column_summaries"][col] = {
                "type": "numeric",
                "null_count": null_count,
                "unique_count": unique_count,
                "min": round(float(numeric_vals.min()), 2),
                "max": round(float(numeric_vals.max()), 2),
                "mean": round(float(numeric_vals.mean()), 2),
                "median": round(float(numeric_vals.median()), 2),
            }
        else:
            vc = series.value_counts()
            top_val = str(vc.index[0]) if len(vc) > 0 else None
            top_freq = int(vc.iloc[0]) if len(vc) > 0 else 0
            stats["column_summaries"][col] = {
                "type": "categorical",
                "null_count": null_count,
                "unique_count": unique_count,
                "most_frequent_value": top_val,
                "most_frequent_count": top_freq,
            }

    return stats


def calculate_metric(
    metric_name: str,
    params: dict[str, Any] | None = None,
    dataset: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any] | float | int | list[dict[str, Any]]:
    clean_params = params or {}
    norm = metric_name.strip().lower()

    if norm in ("total_mrr", "mrr"):
        return compute_total_mrr(dataset)
    if norm in ("total_arr", "arr"):
        return compute_total_arr(dataset)
    if norm in ("avg_adoption", "average_feature_adoption", "adoption_score"):
        return compute_average_adoption_score(dataset)
    if norm in ("mrr_by_tier", "revenue_by_tier"):
        return compute_mrr_by_tier(dataset)
    if norm in ("churn_summary", "churn_rate"):
        return compute_churn_summary(dataset)
    if norm in ("high_risk_customers", "churn_risk"):
        return find_high_risk_customers(dataset)

    # Dynamic Analytical Capabilities (Pandas powered, token efficient)
    if norm in ("group_by", "groupby", "breakdown"):
        table = clean_params.get("table")
        group_by = clean_params.get("group_by") or clean_params.get("by") or clean_params.get("column")
        agg_col = clean_params.get("agg_column") or clean_params.get("value_column")
        agg_func = clean_params.get("agg_func") or clean_params.get("agg") or clean_params.get("function", "count")
        filters = clean_params.get("filters")
        limit = int(clean_params.get("limit", 25))
        if not table or not group_by:
            raise ValueError("Parameters 'table' and 'group_by' are required for group_by metric")
        return compute_group_by(table, group_by, agg_col, agg_func, filters, True, limit, dataset)

    if norm in ("value_counts", "frequency", "distribution"):
        table = clean_params.get("table")
        column = clean_params.get("column")
        filters = clean_params.get("filters")
        top_n = int(clean_params.get("top_n", 15))
        if not table or not column:
            raise ValueError("Parameters 'table' and 'column' are required for value_counts metric")
        return compute_value_counts(table, column, top_n, filters, dataset)

    if norm in ("summary_statistics", "profile_table", "describe_stats", "statistics"):
        table = clean_params.get("table")
        column = clean_params.get("column")
        if not table:
            raise ValueError("Parameter 'table' is required for summary_statistics metric")
        return compute_summary_statistics(table, column, dataset)

    if norm in ("sum", "avg", "average", "mean", "count", "min", "max"):
        table = clean_params.get("table")
        column = clean_params.get("column", "")
        filters = clean_params.get("filters")
        if not table:
            raise ValueError("Parameter 'table' is required for generic aggregation")
        return compute_generic_aggregation(table, column, norm, filters, dataset)

    raise ValueError(
        f"Unknown metric '{metric_name}'. Supported: group_by, value_counts, summary_statistics, "
        "total_mrr, total_arr, average_feature_adoption, mrr_by_tier, churn_summary, high_risk_customers, sum, avg, count, min, max"
    )


def generate_chart(
    chart_type: str,
    title: str,
    data: list[dict[str, Any]],
    x_label: str | None = None,
    y_label: str | None = None,
    table_name: str | None = None,
) -> dict[str, Any]:
    import json
    valid_types = ("pie", "donut", "bar", "line")
    c_type = chart_type.strip().lower()
    if c_type not in valid_types:
        c_type = "bar"

    total_val = sum(float(item.get("value", item.get("count", 0))) for item in data)
    formatted_data: list[dict[str, Any]] = []
    for item in data:
        lbl = str(item.get("label", item.get("name", item.get("key", ""))))
        val = float(item.get("value", item.get("count", 0)))
        pct = round((val / total_val * 100), 2) if total_val > 0 else None
        formatted_data.append({
            "label": lbl,
            "value": int(val) if val.is_integer() else val,
            "percentage": pct if item.get("percentage") is None else float(item["percentage"]),
            "color": item.get("color"),
        })

    chart_spec = {
        "type": c_type,
        "title": title,
        "data": formatted_data,
        "x_label": x_label,
        "y_label": y_label,
        "table_name": table_name,
    }

    markdown_block = f"```chart\n{json.dumps(chart_spec, indent=2)}\n```"

    return {
        "status": "success",
        "chart_spec": chart_spec,
        "markdown_snippet": markdown_block,
        "instruction": "Include the markdown_snippet verbatim in your final answer so the interactive chart is rendered for the user.",
    }

