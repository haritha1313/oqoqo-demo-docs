---
sidebar_position: 1
---

# Pipeline API Reference

Complete API documentation for the `Pipeline` class.

## Pipeline

```python
class Pipeline:
    """
    A composable data pipeline that orchestrates task execution.
    """
```

### Constructor

```python
Pipeline(
    name: str,
    *,
    description: Optional[str] = None,
    version: str = "1.0.0",
    execution_mode: Union[ExecutionMode, str] = "sequential",
    max_parallel_tasks: int = 4,
    timeout_seconds: Optional[float] = None,
    fail_fast: bool = True,
    enable_caching: bool = True,
    enable_tracing: bool = True,
    tracer: Optional[MosaycTracer] = None,
    tags: Optional[Dict[str, str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `str` | required | Unique identifier for the pipeline |
| `description` | `str` | `None` | Human-readable description |
| `version` | `str` | `"1.0.0"` | Semantic version string |
| `execution_mode` | `str` | `"sequential"` | Task execution mode: `sequential`, `parallel`, `async` |
| `max_parallel_tasks` | `int` | `8` | Maximum concurrent tasks in parallel mode |
| `timeout_seconds` | `float` | `None` | Global execution timeout |
| `fail_fast` | `bool` | `True` | Stop on first task failure |
| `enable_caching` | `bool` | `True` | Enable task result caching |
| `enable_tracing` | `bool` | `True` | Enable distributed tracing |
| `tracer` | `MosaycTracer` | `None` | Custom tracer instance |
| `tags` | `Dict[str, str]` | `None` | Pipeline tags for categorization |
| `metadata` | `Dict[str, Any]` | `None` | Additional metadata |

### Methods

#### task

```python
@pipeline.task(
    fn: Optional[Callable] = None,
    *,
    name: Optional[str] = None,
    depends_on: Optional[List[str]] = None,
    retry_policy: Optional[RetryPolicy] = None,
    cache_policy: Optional[CachePolicy] = None,
    timeout: Optional[float] = None,
    tags: Optional[Dict[str, str]] = None,
) -> Union[Task, Callable[[Callable], Task]]
```

Decorator to register a function as a pipeline task.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fn` | `Callable` | `None` | Function to wrap (when used without arguments) |
| `name` | `str` | `None` | Custom task name (defaults to function name) |
| `depends_on` | `List[str]` | `None` | Task names this task depends on |
| `retry_policy` | `RetryPolicy` | `None` | Retry configuration |
| `cache_policy` | `CachePolicy` | `None` | Caching configuration |
| `timeout` | `float` | `None` | Task-specific timeout in seconds |
| `tags` | `Dict[str, str]` | `None` | Task-specific tags |

**Example:**

```python
@pipeline.task
def simple_task():
    return "hello"

@pipeline.task(depends_on=["simple_task"], timeout=30.0)
def dependent_task(simple_task):
    return process(simple_task)
```

#### run

```python
def run(
    *,
    context: Optional[Context] = None,
    inputs: Optional[Dict[str, Any]] = None,
    dry_run: bool = False,
) -> PipelineResult
```

Execute the pipeline synchronously.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `context` | `Context` | `None` | Execution context with configuration |
| `inputs` | `Dict[str, Any]` | `None` | Initial input data |
| `dry_run` | `bool` | `False` | Validate without executing |

**Returns:** `PipelineResult`

**Raises:**
- `PipelineError` - If execution fails
- `ValidationError` - If configuration is invalid

#### run_async

```python
async def run_async(
    *,
    context: Optional[Context] = None,
    inputs: Optional[Dict[str, Any]] = None,
    dry_run: bool = False,
) -> PipelineResult
```

Execute the pipeline asynchronously.

#### visualize

```python
def visualize() -> str
```

Generate a text visualization of the pipeline DAG.

**Returns:** ASCII representation of the task graph.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `str` | Pipeline name |
| `state` | `PipelineState` | Current execution state |
| `tasks` | `Dict[str, TaskDefinition]` | Registered tasks |

---

## PipelineResult

```python
class PipelineResult(BaseModel):
    """Result of a complete pipeline execution."""
```

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `pipeline_name` | `str` | Name of the executed pipeline |
| `run_id` | `str` | Unique run identifier |
| `state` | `str` | Final state: `completed`, `failed`, `cancelled` |
| `duration` | `float` | Total execution time in seconds |
| `task_results` | `Dict[str, TaskResult]` | Results keyed by task name |
| `records_count` | `int` | Total records processed |
| `dry_run` | `bool` | Whether this was a dry run |
| `started_at` | `datetime` | Execution start time |
| `completed_at` | `datetime` | Execution end time |
| `error` | `str` | Error message if failed |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `succeeded` | `bool` | True if completed successfully |
| `failed` | `bool` | True if execution failed |
| `tasks_succeeded` | `int` | Count of successful tasks |
| `tasks_failed` | `int` | Count of failed tasks |
| `total_tasks` | `int` | Total task count |

### Methods

#### get_task_result

```python
def get_task_result(task_name: str) -> Optional[TaskResult]
```

Get result for a specific task.

#### get_failed_tasks

```python
def get_failed_tasks() -> List[TaskResult]
```

Get all failed task results.

#### summary

```python
def summary() -> Dict[str, Any]
```

Generate execution summary dictionary.

---

## TaskResult

```python
class TaskResult(BaseModel):
    """Result of a single task execution."""
```

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `task_name` | `str` | Name of the task |
| `state` | `str` | Final state |
| `duration` | `float` | Execution time in seconds |
| `output` | `Any` | Task output data |
| `error` | `str` | Error message if failed |
| `records_processed` | `int` | Records handled |
| `retries_attempted` | `int` | Retry count |
| `cache_hit` | `bool` | Whether result was cached |

---

## ExecutionMode

```python
class ExecutionMode(str, Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    ASYNC = "async"
```

---

## PipelineState

```python
class PipelineState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"
```

---

## Usage Examples

### Basic Pipeline

```python
from mosayc import Pipeline

pipeline = Pipeline("basic-example")

@pipeline.task
def step_one():
    return [1, 2, 3]

@pipeline.task(depends_on=["step_one"])
def step_two(step_one):
    return [x * 2 for x in step_one]

result = pipeline.run()
print(result.succeeded)  # True
```

### Parallel Execution

```python
pipeline = Pipeline(
    "parallel-example",
    execution_mode="parallel",
    max_parallel_tasks=4,
)

@pipeline.task
def fetch_a():
    return api_a.fetch()

@pipeline.task
def fetch_b():
    return api_b.fetch()

@pipeline.task(depends_on=["fetch_a", "fetch_b"])
def combine(fetch_a, fetch_b):
    return merge(fetch_a, fetch_b)
```

### With Retry Policy

```python
from mosayc import Pipeline, RetryPolicy

pipeline = Pipeline("resilient-pipeline")

@pipeline.task(
    retry_policy=RetryPolicy(
        max_attempts=3,
        backoff="exponential",
        base_delay=1.0,
    )
)
def flaky_task():
    return external_api.call()
```

### Async Pipeline

```python
import asyncio
from mosayc import Pipeline

pipeline = Pipeline("async-pipeline", execution_mode="async")

@pipeline.task
async def async_fetch():
    async with aiohttp.ClientSession() as session:
        response = await session.get("https://api.example.com")
        return await response.json()

async def main():
    result = await pipeline.run_async()
    print(result)

asyncio.run(main())
```
