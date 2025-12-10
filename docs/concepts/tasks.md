---
sidebar_position: 2
---

# Tasks

Tasks are the fundamental units of work in a Mosayc pipeline. Each task is a Python function that performs a specific operation.

## Defining Tasks

### Basic Task

The simplest task is a function decorated with `@pipeline.task`:

```python
from mosayc import Pipeline

pipeline = Pipeline("example")

@pipeline.task
def my_task():
    return "Hello, Mosayc!"
```

### Standalone Tasks

Create tasks without binding to a pipeline:

```python
from mosayc import task

@task
def standalone_task(data):
    return process(data)

# Can be called directly
result = standalone_task([1, 2, 3])
```

### Task with Dependencies

Declare dependencies using `depends_on`:

```python
@pipeline.task
def fetch_data():
    return db.query("SELECT * FROM users")

@pipeline.task(depends_on=["fetch_data"])
def process_data(fetch_data):
    # The output of fetch_data is passed as an argument
    return [transform(record) for record in fetch_data]
```

### Multiple Dependencies

```python
@pipeline.task
def get_users():
    return fetch_users()

@pipeline.task
def get_products():
    return fetch_products()

@pipeline.task(depends_on=["get_users", "get_products"])
def create_report(get_users, get_products):
    # Both outputs are available
    return generate_report(get_users, get_products)
```

## Task Configuration

### Custom Names

Override the default function name:

```python
@pipeline.task(name="extract_customer_data")
def extract():
    pass
```

### Timeouts

Set a maximum execution time:

```python
@pipeline.task(timeout=30.0)  # 30 seconds
def time_limited_task():
    pass
```

### Tags

Add metadata for filtering and grouping:

```python
@pipeline.task(tags={"type": "io", "priority": "high"})
def tagged_task():
    pass
```

### Priority

Control task execution order when multiple tasks are ready:

```python
@pipeline.task(priority=10)  # Higher priority, runs first
def critical_task():
    pass

@pipeline.task(priority=1)   # Lower priority, runs later
def background_task():
    pass
```

Priority values range from 1 (lowest) to 10 (highest). Default is 5.

## Task Decorators

Mosayc provides decorators to modify task behavior without changing the core logic.

### Conditional Execution

Run tasks only when conditions are met:

```python
from mosayc import when

@pipeline.task
@when(lambda ctx: ctx.env == "production")
def production_only_task():
    """Only runs in production."""
    pass

@pipeline.task
@when(lambda ctx: ctx.get("feature_flag"))
def feature_task():
    """Only runs when feature flag is enabled."""
    pass
```

### Parallel Processing

Process items in parallel:

```python
from mosayc import parallel

@pipeline.task
@parallel(max_workers=4)
def process_item(item):
    """Processes each item concurrently."""
    return transform(item)

# When called with a list, items are processed in parallel
results = process_item([item1, item2, item3, item4])
```

### Retry Logic

Automatically retry on failure:

```python
from mosayc import retry

@pipeline.task
@retry(max_attempts=3, backoff="exponential")
def flaky_api_call():
    return external_api.fetch()
```

### Caching

Cache results to avoid recomputation:

```python
from mosayc import cache

@pipeline.task
@cache(ttl=3600, key_fn=lambda doc: doc["id"])
def expensive_computation(doc):
    return compute(doc)
```

### Timeouts

Enforce execution time limits:

```python
from mosayc import timeout

@pipeline.task
@timeout(seconds=30.0)
def time_bounded_task():
    return long_running_operation()
```

## Async Tasks

Tasks can be async functions:

```python
@pipeline.task
async def async_fetch():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com") as response:
            return await response.json()

@pipeline.task(depends_on=["async_fetch"])
async def async_process(async_fetch):
    return await process_async(async_fetch)
```

## Task Inputs and Outputs

### Input Types

Tasks can accept various input types:

```python
@pipeline.task
def typed_task(
    users: list[dict],
    config: dict,
    threshold: float = 0.5,
) -> list[dict]:
    return [u for u in users if u["score"] > threshold]
```

### Output Types

Tasks can return any serializable type:

```python
# Return a list
@pipeline.task
def return_list():
    return [1, 2, 3]

# Return a dict
@pipeline.task
def return_dict():
    return {"key": "value"}

# Return a generator (for streaming)
@pipeline.task
def return_generator():
    for i in range(100):
        yield process(i)
```

## Task Results

Each task execution produces a `TaskResult`:

```python
result = pipeline.run()

for task_name, task_result in result.task_results.items():
    print(f"Task: {task_name}")
    print(f"  Status: {task_result.state}")
    print(f"  Duration: {task_result.duration:.2f}s")
    print(f"  Records: {task_result.records_processed}")
    print(f"  Cache hit: {task_result.cache_hit}")
    print(f"  Retries: {task_result.retries_attempted}")
```

## Task Patterns

### Extract-Transform-Load

The classic ETL pattern:

```python
@pipeline.task
def extract():
    return source.read()

@pipeline.task(depends_on=["extract"])
def transform(extract):
    return [process(record) for record in extract]

@pipeline.task(depends_on=["transform"])
def load(transform):
    return sink.write(transform)
```

### Fan-Out / Fan-In

Process data in parallel branches:

```python
@pipeline.task
def fetch_data():
    return get_raw_data()

@pipeline.task(depends_on=["fetch_data"])
def process_branch_a(fetch_data):
    return process_a(fetch_data)

@pipeline.task(depends_on=["fetch_data"])
def process_branch_b(fetch_data):
    return process_b(fetch_data)

@pipeline.task(depends_on=["process_branch_a", "process_branch_b"])
def merge_results(process_branch_a, process_branch_b):
    return combine(process_branch_a, process_branch_b)
```

### Conditional Branching

Different paths based on data:

```python
@pipeline.task
def classify_data():
    data = fetch()
    return {"type_a": [...], "type_b": [...]}

@pipeline.task(depends_on=["classify_data"])
@when(lambda ctx: ctx.get("process_type_a", True))
def process_type_a(classify_data):
    return handle_type_a(classify_data["type_a"])

@pipeline.task(depends_on=["classify_data"])
@when(lambda ctx: ctx.get("process_type_b", True))
def process_type_b(classify_data):
    return handle_type_b(classify_data["type_b"])
```

### Error Handling

Handle errors gracefully:

```python
@pipeline.task
def risky_operation():
    try:
        return external_call()
    except ExternalError as e:
        logger.warning(f"External call failed: {e}")
        return fallback_data()
```

## Best Practices

### 1. Pure Functions

Tasks should be pure functions when possible:

```python
# Good - no side effects
@pipeline.task
def transform(data):
    return [item * 2 for item in data]

# Avoid - hidden state
counter = 0

@pipeline.task
def bad_transform(data):
    global counter
    counter += 1
    return data
```

### 2. Explicit Dependencies

Always declare dependencies explicitly:

```python
# Good
@pipeline.task(depends_on=["fetch_config"])
def use_config(fetch_config):
    return process(fetch_config)

# Bad - implicit dependency
config = None

@pipeline.task
def bad_use_config():
    return process(config)
```

### 3. Idempotent Operations

Tasks should produce the same result when run multiple times:

```python
# Good - idempotent
@pipeline.task
def upsert_records(records):
    return db.upsert(records, on_conflict="update")

# Bad - not idempotent
@pipeline.task
def insert_records(records):
    return db.insert(records)  # Fails on duplicate
```

### 4. Appropriate Granularity

Balance between too fine and too coarse:

```python
# Too fine-grained
@pipeline.task
def fetch_user(user_id): pass

@pipeline.task
def validate_user(user): pass

@pipeline.task
def format_user(user): pass

# Too coarse-grained
@pipeline.task
def do_everything(): pass

# Just right
@pipeline.task
def fetch_and_validate_users():
    users = fetch_users()
    return [u for u in users if is_valid(u)]
```

## Next Steps

- [Context](/concepts/context) - Passing configuration to tasks
- [Pipelines](/concepts/pipelines) - Learn about pipeline configuration
- [Observability](/guides/observability) - Monitor your task execution
