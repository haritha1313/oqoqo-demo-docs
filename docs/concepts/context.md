---
sidebar_position: 3
---

# Context

Context objects carry configuration, secrets, and state through pipeline execution.

## Creating a Context

```python
from mosayc import Context, LogConfig

ctx = Context(
    env="production",
    log_config=LogConfig(level="info", format="json"),
    enable_metrics=True,
    enable_tracing=True,
    project_id="my-project",
)
```

## Environment Configuration

### Setting the Environment

```python
from mosayc import Context, Environment

# Using string
ctx = Context(env="production")

# Using enum
ctx = Context(env=Environment.PRODUCTION)
```

### Checking Environment

```python
if ctx.is_production:
    # Use production settings
    pass

if ctx.is_development:
    # Enable debug features
    pass
```

## Storing Values

### Regular Values

Store and retrieve arbitrary values:

```python
# Set values
ctx.set("batch_size", 1000)
ctx.set("api_endpoint", "https://api.example.com")

# Get values
batch_size = ctx.get("batch_size")
endpoint = ctx.get("api_endpoint", default="http://localhost")
```

### Secrets

Store sensitive values securely:

```python
# Set secrets (stored separately from regular values)
ctx.set_secret("API_KEY", "secret-key-value")
ctx.set_secret("DATABASE_PASSWORD", "db-pass")

# Get secrets (also checks environment variables)
api_key = ctx.get_secret("API_KEY")
db_pass = ctx.get_secret("DATABASE_PASSWORD")

# Require a secret (raises if not found)
required_key = ctx.require_secret("REQUIRED_API_KEY")
```

### Environment Variable Fallback

`get_secret` automatically checks environment variables:

```python
# If OPENAI_API_KEY is set in environment
api_key = ctx.get_secret("OPENAI_API_KEY")  # Returns env var value
```

## Using Context in Tasks

### Accessing Context

Context is available in tasks through dependency injection:

```python
@pipeline.task
def task_with_context(ctx: Context):
    endpoint = ctx.get("api_endpoint")
    api_key = ctx.get_secret("API_KEY")
    return call_api(endpoint, api_key)
```

### Conditional Logic

Use context for environment-specific behavior:

```python
@pipeline.task
def load_data(ctx: Context):
    if ctx.is_production:
        return production_source.read()
    else:
        return sample_data()
```

## Execution Context

During pipeline execution, an `ExecutionContext` is created with run-specific information:

```python
from mosayc import ExecutionContext

@pipeline.task
def task_with_exec_context(exec_ctx: ExecutionContext):
    print(f"Pipeline: {exec_ctx.pipeline_name}")
    print(f"Run ID: {exec_ctx.run_id}")
    print(f"Started: {exec_ctx.started_at}")
    print(f"Elapsed: {exec_ctx.elapsed_seconds()}s")
```

### Accessing Task Outputs

```python
@pipeline.task(depends_on=["previous_task"])
def dependent_task(exec_ctx: ExecutionContext, previous_task):
    # Access outputs from any completed task
    other_output = exec_ctx.get_output("other_task")
    return process(previous_task, other_output)
```

### Storing Metadata

```python
@pipeline.task
def task_with_metadata(exec_ctx: ExecutionContext):
    result = compute()
    exec_ctx.metadata["custom_metric"] = len(result)
    return result
```

## Passing Context to Pipelines

```python
from mosayc import Pipeline, Context

pipeline = Pipeline("my-pipeline")

# Create context with configuration
ctx = Context(env="production")
ctx.set("max_records", 10000)
ctx.set_secret("API_KEY", os.getenv("API_KEY"))

# Pass to pipeline
result = pipeline.run(context=ctx)
```

## Context Serialization

Export context for logging or debugging (secrets excluded):

```python
ctx_dict = ctx.to_dict()
print(ctx_dict)
# {
#     "env": "production",
#     "log_level": "info",
#     "enable_metrics": True,
#     "data": {"batch_size": 1000},
#     "created_at": "2024-01-15T10:30:00Z"
# }
```

## Best Practices

### 1. Use Environment Variables for Secrets

```python
# Good
ctx.set_secret("API_KEY", os.getenv("API_KEY"))

# Bad - hardcoded secrets
ctx.set_secret("API_KEY", "sk-1234567890")
```

### 2. Set Defaults

```python
# Good - provide defaults
batch_size = ctx.get("batch_size", default=1000)

# Handle missing values
endpoint = ctx.get("api_endpoint")
if endpoint is None:
    raise ConfigurationError("api_endpoint not configured")
```

### 3. Environment-Specific Configuration

```python
ctx = Context(env=os.getenv("ENVIRONMENT", "development"))

if ctx.is_production:
    ctx.set("database_url", os.getenv("PROD_DATABASE_URL"))
    ctx.set("log_level", "warning")
else:
    ctx.set("database_url", "postgresql://localhost/dev")
    ctx.set("log_level", "debug")
```

### 4. Document Required Configuration

```python
"""
Required context configuration:
- api_endpoint: Base URL for the API
- batch_size: Records per batch (default: 1000)

Required secrets:
- API_KEY: Authentication key
- DATABASE_URL: Database connection string
"""
```

## Next Steps

- [Observability](/guides/observability) - Monitoring and tracing
- [Pipelines](/concepts/pipelines) - Learn about pipeline configuration
