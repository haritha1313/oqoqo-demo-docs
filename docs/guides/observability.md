---
sidebar_position: 2
---

# Observability Guide

Mosayc provides comprehensive observability features for monitoring pipeline execution, debugging issues, and optimizing performance.

## Distributed Tracing

### Setting Up the Tracer

```python
from mosayc import Pipeline
from mosayc.observability import MosaycTracer

# Create tracer
tracer = MosaycTracer(
    endpoint="https://telemetry.mosayc.dev",
    project_id="my-project",
    api_key="your-api-key",
    sample_rate=1.0,  # Trace 100% of requests
)

# Attach to pipeline
pipeline = Pipeline("traced-pipeline", tracer=tracer)
```

### Automatic Instrumentation

When a tracer is attached, all tasks are automatically traced:

```python
@pipeline.task
def fetch_data():
    # Automatically creates a span named "fetch_data"
    return db.query("SELECT * FROM users")

@pipeline.task(depends_on=["fetch_data"])
def process_data(fetch_data):
    # Creates "process_data" span with parent link
    return transform(fetch_data)
```

### Manual Spans

Create custom spans for fine-grained tracing:

```python
@pipeline.task
def complex_task():
    with tracer.span("database_query") as span:
        span.set_attribute("query_type", "select")
        data = db.query("...")
        span.set_attribute("row_count", len(data))

    with tracer.span("transformation") as span:
        result = transform(data)
        span.add_event("transform_complete", {"records": len(result)})

    return result
```

### LLM Call Tracking

Record LLM-specific metrics:

```python
@pipeline.task
def generate_summary():
    with tracer.span("llm_call") as span:
        start = time.time()
        response = llm.generate("Summarize this...")
        latency = (time.time() - start) * 1000

        tracer.record_llm_call(
            span,
            model="gpt-4",
            tokens_input=response.tokens_input,
            tokens_output=response.tokens_output,
            latency_ms=latency,
            cost_usd=calculate_cost(response),
        )

        return response.content
```

### Vector Operation Tracking

```python
@pipeline.task
def store_embeddings(embeddings):
    with tracer.span("vector_upsert") as span:
        start = time.time()
        result = vector_db.upsert(embeddings)
        latency = (time.time() - start) * 1000

        tracer.record_vector_operation(
            span,
            operation="upsert",
            vector_count=len(embeddings),
            dimensions=1536,
            latency_ms=latency,
        )

        return result
```

## Metrics Collection

### Using the Metrics Collector

```python
from mosayc.observability import MetricsCollector

collector = MetricsCollector()

# Counter - monotonically increasing
records_processed = collector.counter(
    "records_processed",
    description="Total records processed",
    labels=["pipeline", "task"],
)
records_processed.inc(100, pipeline="etl", task="transform")

# Gauge - can go up or down
active_tasks = collector.gauge(
    "active_tasks",
    description="Currently running tasks",
)
active_tasks.set(5)
active_tasks.inc()
active_tasks.dec()

# Histogram - distribution of values
latency = collector.histogram(
    "task_latency_ms",
    description="Task execution latency",
    buckets=[10, 50, 100, 500, 1000, 5000],
)
latency.observe(150)
latency.observe(250)
```

### Accessing Metrics

```python
# Get specific metric values
print(records_processed.value)  # Total count
print(active_tasks.value)       # Current value
print(latency.percentile(95))   # P95 latency
print(latency.mean())           # Average latency

# Export all metrics
metrics = collector.export()
print(json.dumps(metrics, indent=2))
```

### Built-in Pipeline Metrics

Pipelines automatically collect metrics:

```python
result = pipeline.run()

# Access run metrics
print(f"Duration: {result.duration}s")
print(f"Records: {result.records_count}")
print(f"Tasks succeeded: {result.tasks_succeeded}")
print(f"Tasks failed: {result.tasks_failed}")
```

## Structured Logging

### Configure Logging

Mosayc uses `structlog` for structured logging:

```python
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
```

### Logging in Tasks

```python
import structlog

logger = structlog.get_logger()

@pipeline.task
def logged_task():
    logger.info("Starting task", records=1000)

    try:
        result = process()
        logger.info("Task completed", processed=len(result))
        return result
    except Exception as e:
        logger.error("Task failed", error=str(e), exc_info=True)
        raise
```

### Log Output

```json
{
  "event": "Starting task",
  "records": 1000,
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "logger": "my_pipeline"
}
```

## Dashboard Integration

### Mosayc Cloud Dashboard

View traces and metrics in the Mosayc Dashboard:

1. Sign up at https://app.mosayc.dev
2. Create a project and get your API key
3. Configure the tracer:

```python
tracer = MosaycTracer(
    endpoint="https://telemetry.mosayc.dev",
    project_id="your-project-id",
    api_key="your-api-key",
)
```

### OpenTelemetry Export

Export to any OpenTelemetry-compatible backend:

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure OpenTelemetry
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
```

### Prometheus Metrics

Export metrics in Prometheus format:

```python
from prometheus_client import start_http_server, Counter, Histogram

# Start metrics server
start_http_server(8000)

# Create Prometheus metrics
prom_records = Counter('mosayc_records_total', 'Total records processed')
prom_latency = Histogram('mosayc_task_latency_seconds', 'Task latency')

@pipeline.task
def instrumented_task():
    with prom_latency.time():
        result = process()
        prom_records.inc(len(result))
        return result
```

## Alerting

### Setting Up Alerts

Configure alerts for pipeline failures:

```python
from mosayc.observability import AlertManager

alerts = AlertManager(
    slack_webhook="https://hooks.slack.com/...",
    pagerduty_key="...",
)

@pipeline.on_failure
def handle_failure(result):
    alerts.send(
        severity="critical",
        title=f"Pipeline {result.pipeline_name} failed",
        message=f"Run {result.run_id} failed after {result.duration}s",
        details=result.get_failed_tasks(),
    )
```

### Custom Alert Conditions

```python
@pipeline.on_complete
def check_metrics(result):
    if result.duration > 300:  # Over 5 minutes
        alerts.send(
            severity="warning",
            title="Slow pipeline execution",
            message=f"Pipeline took {result.duration}s",
        )

    if result.records_count < 100:
        alerts.send(
            severity="warning",
            title="Low record count",
            message=f"Only {result.records_count} records processed",
        )
```

## Debugging

### Dry Run Mode

Validate pipelines without execution:

```bash
mosayc run pipeline.py --dry-run
```

### Verbose Logging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Or via environment
# export MOSAYC_LOG_LEVEL=debug
```

### Inspecting Results

```python
result = pipeline.run()

# Print detailed results
print(result.summary())

# Inspect individual tasks
for name, task_result in result.task_results.items():
    if task_result.failed:
        print(f"Task {name} failed:")
        print(f"  Error: {task_result.error}")
        print(f"  Duration: {task_result.duration}s")
```

## Best Practices

### 1. Always Enable Tracing in Production

```python
tracer = MosaycTracer(
    project_id="prod-project",
    sample_rate=0.1,  # Sample 10% in high-volume scenarios
)
```

### 2. Use Meaningful Span Names

```python
# Good
with tracer.span("fetch_user_orders") as span:
    span.set_attribute("user_id", user_id)

# Bad
with tracer.span("task1"):
    pass
```

### 3. Track Business Metrics

```python
@pipeline.task
def process_orders():
    result = process()

    collector.counter("orders_processed").inc(len(result))
    collector.counter("revenue_total").inc(sum(o["amount"] for o in result))

    return result
```

### 4. Set Up Dashboards

Create dashboards for:
- Pipeline execution duration over time
- Task failure rates
- LLM token usage and costs
- Vector operation latencies

## Next Steps

- [Connectors Guide](/guides/connectors) - Integrate with databases and services
- [RAG Pipeline Example](/examples/rag-pipeline) - See observability in action
