---
sidebar_position: 1
---

# Pipelines

Pipelines are the core abstraction in Mosayc. They define the structure and flow of data processing workflows.

## What is a Pipeline?

A Pipeline is a directed acyclic graph (DAG) of tasks. Each task performs a specific operation, and tasks can depend on the outputs of other tasks.

```python
from mosayc import Pipeline

pipeline = Pipeline("my-pipeline")
```

## Pipeline Configuration

Pipelines support various configuration options:

```python
pipeline = Pipeline(
    name="production-etl",
    description="Daily ETL for analytics",
    version="1.2.0",
    execution_mode="parallel",      # sequential, parallel, async
    max_parallel_tasks=4,           # Max concurrent tasks
    timeout_seconds=3600,           # Global timeout
    fail_fast=True,                 # Stop on first failure
    enable_caching=True,            # Enable task result caching
    enable_tracing=True,            # Enable distributed tracing
    tags={"team": "data", "env": "production"},
)
```

### Execution Modes

| Mode | Description |
|------|-------------|
| `sequential` | Tasks run one at a time in dependency order |
| `parallel` | Independent tasks run concurrently |
| `async` | Full async execution for I/O-bound workloads |

## Defining Tasks

Tasks are defined using the `@pipeline.task` decorator:

```python
@pipeline.task
def extract():
    """A simple task with no dependencies."""
    return fetch_data()

@pipeline.task(depends_on=["extract"])
def transform(extract):
    """A task that depends on 'extract'."""
    return process(extract)
```

### Task Parameters

The `@pipeline.task` decorator accepts several parameters:

```python
@pipeline.task(
    name="custom_name",              # Override function name
    depends_on=["task1", "task2"],   # Task dependencies
    retry_policy=RetryPolicy(...),   # Retry configuration
    cache_policy=CachePolicy(...),   # Caching configuration
    timeout=60.0,                    # Task-specific timeout
    tags={"type": "io"},             # Task tags
)
def my_task():
    pass
```

### Dependency Injection

Task outputs are automatically passed to dependent tasks:

```python
@pipeline.task
def get_users():
    return [{"id": 1}, {"id": 2}]

@pipeline.task
def get_orders():
    return [{"user_id": 1, "total": 100}]

@pipeline.task(depends_on=["get_users", "get_orders"])
def merge(get_users, get_orders):
    # Both outputs are available as function arguments
    return join(get_users, get_orders, on="id")
```

## Running Pipelines

### Basic Execution

```python
result = pipeline.run()
print(result.succeeded)  # True/False
print(result.duration)   # Execution time in seconds
```

### With Context

Pass configuration through a Context object:

```python
from mosayc import Context

ctx = Context(
    env="production",
    log_level="info",
)
ctx.set("api_endpoint", "https://api.example.com")
ctx.set_secret("API_KEY", "secret-key")

result = pipeline.run(context=ctx)
```

### With Inputs

Provide initial data to the pipeline:

```python
result = pipeline.run(inputs={
    "date": "2024-01-15",
    "batch_size": 1000,
})
```

### Async Execution

For async pipelines:

```python
import asyncio

async def main():
    result = await pipeline.run_async()
    print(result)

asyncio.run(main())
```

### Dry Run

Validate the pipeline without executing:

```python
result = pipeline.run(dry_run=True)
# Checks for:
# - Missing dependencies
# - Circular dependencies
# - Invalid configuration
```

## Pipeline Results

The `PipelineResult` object contains detailed execution information:

```python
result = pipeline.run()

# Overall status
print(result.succeeded)        # True if all tasks completed
print(result.failed)           # True if any task failed
print(result.state)            # "completed", "failed", "cancelled"

# Timing
print(result.duration)         # Total execution time
print(result.started_at)       # Start timestamp
print(result.completed_at)     # End timestamp

# Metrics
print(result.records_count)    # Total records processed
print(result.total_tasks)      # Number of tasks
print(result.tasks_succeeded)  # Successful task count
print(result.tasks_failed)     # Failed task count

# Task details
for name, task_result in result.task_results.items():
    print(f"{name}: {task_result.duration:.2f}s")
```

## Visualizing Pipelines

Generate a text representation of the task graph:

```python
print(pipeline.visualize())
```

Output:

```
Pipeline: my-pipeline
========================================
  [extract]
    depends on: none
  [transform]
    depends on: extract
  [load]
    depends on: transform
```

## Pipeline Lifecycle

1. **Validation** - Check configuration and dependencies
2. **Topological Sort** - Determine execution order
3. **Execution** - Run tasks in order
4. **Result Collection** - Gather outputs and metrics

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌────────┐
│ Validate │───▶│   Sort   │───▶│  Execute  │───▶│ Result │
└──────────┘    └──────────┘    └───────────┘    └────────┘
```

## Error Handling

### Fail-Fast Mode

By default, pipelines stop on the first task failure:

```python
pipeline = Pipeline("strict", fail_fast=True)
```

### Continue on Failure

To continue executing independent tasks:

```python
pipeline = Pipeline("resilient", fail_fast=False)
```

### Handling Failures

Check for failures in results:

```python
result = pipeline.run()

if result.failed:
    for task_result in result.get_failed_tasks():
        print(f"Task {task_result.task_name} failed: {task_result.error}")
```

## Best Practices

### 1. Keep Tasks Focused

Each task should do one thing well:

```python
# Good - focused tasks
@pipeline.task
def fetch_users():
    return db.query("SELECT * FROM users")

@pipeline.task(depends_on=["fetch_users"])
def validate_users(fetch_users):
    return [u for u in fetch_users if is_valid(u)]

# Bad - task does too much
@pipeline.task
def fetch_and_validate_and_transform():
    users = db.query("SELECT * FROM users")
    valid = [u for u in users if is_valid(u)]
    return transform(valid)
```

### 2. Use Meaningful Names

```python
# Good
@pipeline.task
def extract_customer_orders():
    pass

# Bad
@pipeline.task
def task1():
    pass
```

### 3. Handle Large Data with Batching

```python
@pipeline.task
def process_in_batches():
    for batch in source.read_batch(batch_size=1000):
        yield process(batch)
```

### 4. Add Observability

Always enable tracing in production:

```python
from mosayc.observability import MosaycTracer

tracer = MosaycTracer(project_id="my-project")
pipeline = Pipeline("production-pipeline", tracer=tracer)
```

## Next Steps

- [Tasks](/concepts/tasks) - Deep dive into task configuration
- [Context](/concepts/context) - Managing configuration and state
- [Policies](/concepts/policies) - Retry, caching, and timeouts
