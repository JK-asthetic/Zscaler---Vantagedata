# Tool definitions formatted for Anthropic Claude function-calling API.
from typing import Any

TOOLS_SCHEMA: list[dict[str, Any]] = [
    {
        "name": "list_tables",
        "description": "Lists all available table names in the dataset.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "describe_table",
        "description": "Returns the schema, column names, total row count, and sample records for a table.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Name of the table to inspect (e.g. customers, subscriptions, usage, support_tickets, revenue_events)",
                },
            },
            "required": ["table_name"],
        },
    },
    {
        "name": "query_table",
        "description": "Queries records from a table with optional field filters, column projection, sorting, and limit. Use this ONLY to lookup specific records, NOT for computing aggregates, distributions, or summaries across the table.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Name of the table to query",
                },
                "filters": {
                    "type": "object",
                    "description": "Field filters. For exact match: {'status': 'active'}. For operators: {'feature_adoption_score': {'lt': 50}}.",
                },
                "columns": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of specific column names to return (avoids retrieving unnecessary fields).",
                },
                "sort_by": {
                    "type": "string",
                    "description": "Optional column name to sort records by",
                },
                "ascending": {
                    "type": "boolean",
                    "description": "Sort direction: true for ascending (default), false for descending",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of records to return (defaults to 50)",
                },
            },
            "required": ["table_name"],
        },
    },
    {
        "name": "join_tables",
        "description": "Performs an inner or left join between two tables using a common key field (e.g. customer_id).",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_a": {
                    "type": "string",
                    "description": "First table name (e.g. customers)",
                },
                "table_b": {
                    "type": "string",
                    "description": "Second table name (e.g. subscriptions)",
                },
                "key": {
                    "type": "string",
                    "description": "Common key attribute present in both tables (e.g. customer_id)",
                },
                "join_type": {
                    "type": "string",
                    "enum": ["inner", "left"],
                    "description": "Join type: 'inner' (default) or 'left'",
                },
            },
            "required": ["table_a", "table_b", "key"],
        },
    },
    {
        "name": "calculate_metric",
        "description": (
            "Performs data analysis and statistical computation in Pandas across the entire dataset without dumping raw rows. "
            "Use this tool for all analytical questions, distributions, breakdowns, and aggregations."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "metric_name": {
                    "type": "string",
                    "description": (
                        "The analytical computation or metric to perform:\n"
                        "- 'group_by': Group by a column with aggregation (count, sum, avg, min, max) across groups\n"
                        "- 'value_counts': Frequency distribution & percentages of a categorical column\n"
                        "- 'summary_statistics': Full statistical profile (null count, unique count, min, max, mean, median, top value)\n"
                        "- 'sum' | 'avg' | 'count' | 'min' | 'max': Direct aggregation on a numeric column\n"
                        "- 'total_mrr' | 'total_arr' | 'average_feature_adoption' | 'mrr_by_tier' | 'churn_summary' | 'high_risk_customers': SaaS metrics"
                    ),
                },
                "params": {
                    "type": "object",
                    "description": (
                        "Parameters tailored to the metric:\n"
                        "- For 'group_by': {'table': str, 'group_by': str, 'agg_column': str (optional), 'agg_func': 'count'|'sum'|'avg'|'min'|'max', 'filters': dict (optional), 'limit': int (optional)}\n"
                        "- For 'value_counts': {'table': str, 'column': str, 'top_n': int (optional, default 15), 'filters': dict (optional)}\n"
                        "- For 'summary_statistics': {'table': str, 'column': str (optional)}\n"
                        "- For aggregations ('sum', 'avg', 'count', 'min', 'max'): {'table': str, 'column': str, 'filters': dict (optional)}\n"
                    ),
                },
            },
            "required": ["metric_name"],
        },
    },
    {
        "name": "generate_chart",
        "description": (
            "Generates an interactive visual chart (pie, donut, bar, or line chart) for the user to view in the chat. "
            "Always compute the data first using calculate_metric or query_table, then pass the aggregated data points to this tool. "
            "You MUST output the returned markdown_snippet in your final answer so the interactive chart renders visually in the UI."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["pie", "donut", "bar", "line"],
                    "description": "Visual chart type: 'pie', 'donut', 'bar', or 'line'",
                },
                "title": {
                    "type": "string",
                    "description": "Clear, informative chart title (e.g. 'Customer Distribution by Industry')",
                },
                "data": {
                    "type": "array",
                    "description": "Array of data points with 'label' and numerical 'value'",
                    "items": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string", "description": "Category or label name"},
                            "value": {"type": "number", "description": "Numeric value for this item"},
                            "percentage": {"type": "number", "description": "Optional percentage value"},
                        },
                        "required": ["label", "value"],
                    },
                },
                "x_label": {
                    "type": "string",
                    "description": "Optional X-axis label (for bar or line charts)",
                },
                "y_label": {
                    "type": "string",
                    "description": "Optional Y-axis label (for bar or line charts)",
                },
                "table_name": {
                    "type": "string",
                    "description": "Optional table name from which data was derived",
                },
            },
            "required": ["chart_type", "title", "data"],
        },
    },
]


def get_tools_schema() -> list[dict[str, Any]]:
    return TOOLS_SCHEMA
