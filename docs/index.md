---
sidebar_position: 1
slug: /
---

# Mosayc Documentation

**Build composable AI-powered data pipelines with unprecedented observability.**

Mosayc is a Python framework for building production-grade data pipelines that seamlessly integrate LLMs, vector databases, and traditional data processing. Define workflows as code, get automatic retries, caching, and real-time observability out of the box.

## Why Mosayc?

Modern AI applications require moving data between databases, LLMs, vector stores, and APIs. This creates complex orchestration challenges:

- **LLM calls are expensive and slow** - You need caching and smart retries
- **Vector operations need batching** - Naive implementations waste resources
- **Pipelines fail in production** - Without observability, debugging is painful
- **Code becomes spaghetti** - Ad-hoc scripts don't scale

Mosayc solves these problems with a unified framework designed for AI-native data engineering.

## Key Features

### Composable Pipeline Architecture

Build complex workflows from simple, reusable tasks. Each task is a pure function that can be tested in isolation.

```python
from mosayc import Pipeline, task

pipeline = Pipeline("document-processor")

@pipeline.task
def fetch_documents():
    return db.query("SELECT * FROM documents")

@pipeline.task(depends_on=["fetch_documents"])
def generate_embeddings(fetch_documents):
    return embedder.embed([d["content"] for d in fetch_documents])

@pipeline.task(depends_on=["generate_embeddings"])
def store_vectors(generate_embeddings):
    return vector_db.upsert(generate_embeddings)
```

### AI-Native Connectors

First-class support for the tools you actually use:

| Category | Connectors |
|----------|------------|
| **LLMs** | OpenAI, Anthropic, Cohere, HuggingFace, Bedrock |
| **Vector DBs** | Pinecone, Weaviate, Qdrant, Chroma, Milvus |
| **Databases** | PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery |
| **Storage** | S3, GCS, Azure Blob, Local filesystem |
| **Queues** | Kafka, RabbitMQ, Redis Streams, SQS |

### Built-in Observability

Every pipeline run is traced automatically. See exactly what happened, how long it took, and how much it cost.

```python
from mosayc.observability import MosaycTracer

tracer = MosaycTracer(project_id="my-project")
pipeline = Pipeline("traced-pipeline", tracer=tracer)

# Traces include:
# - Task execution timeline
# - LLM token usage and costs
# - Vector operation metrics
# - Error details and stack traces
```

### Production-Ready Policies

Automatic retries, caching, timeouts, and circuit breakers - without writing boilerplate.

```python
from mosayc import task, RetryPolicy, CachePolicy

@task(
    retry=RetryPolicy(max_attempts=3, backoff="exponential"),
    cache=CachePolicy(ttl=3600)
)
def expensive_llm_call(document):
    return llm.generate(document)
```

## Quick Start

Install Mosayc:

```bash
pip install mosayc
```

Create your first pipeline:

```python
from mosayc import Pipeline

pipeline = Pipeline("hello-world")

@pipeline.task
def greet():
    return "Hello from Mosayc!"

result = pipeline.run()
print(result)  # ✓ Pipeline 'hello-world' completed in 0.01s
```

Ready to build something real? Check out the [Getting Started Guide](/getting-started/installation).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
├─────────────────────────────────────────────────────────────┤
│                      Mosayc Pipeline                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Task   │───▶│  Task   │───▶│  Task   │───▶│  Task   │  │
│  │ Extract │    │Transform│    │  Embed  │    │  Load   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
├─────────────────────────────────────────────────────────────┤
│   Policies: Retry │ Cache │ Timeout │ Circuit Breaker       │
├─────────────────────────────────────────────────────────────┤
│   Observability: Tracing │ Metrics │ Logging                │
├─────────────────────────────────────────────────────────────┤
│                       Connectors                             │
│  ┌─────┐ ┌──────┐ ┌────────┐ ┌─────┐ ┌───────┐ ┌──────┐   │
│  │ DBs │ │ LLMs │ │VectorDB│ │ S3  │ │ Kafka │ │ APIs │   │
│  └─────┘ └──────┘ └────────┘ └─────┘ └───────┘ └──────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Community

- [GitHub](https://github.com/mosayc-dev/mosayc) - Source code and issues
- [Discord](https://discord.gg/mosayc) - Chat with the community
- [Twitter](https://twitter.com/mosayc_dev) - Updates and announcements

## License

Mosayc is open source under the Apache 2.0 license.
