---
sidebar_position: 2
---

# Quick Start

Build your first Mosayc pipeline in 5 minutes.

## Your First Pipeline

Let's create a simple ETL pipeline that processes data through multiple steps.

```python
from mosayc import Pipeline

# Create a pipeline
pipeline = Pipeline("my-first-pipeline")

# Define tasks using decorators
@pipeline.task
def extract():
    """Simulate extracting data from a source."""
    return [
        {"id": 1, "name": "Alice", "score": 85},
        {"id": 2, "name": "Bob", "score": 92},
        {"id": 3, "name": "Charlie", "score": 78},
    ]

@pipeline.task(depends_on=["extract"])
def transform(extract):
    """Process the extracted data."""
    return [
        {**record, "grade": "A" if record["score"] >= 90 else "B" if record["score"] >= 80 else "C"}
        for record in extract
    ]

@pipeline.task(depends_on=["transform"])
def load(transform):
    """Load the transformed data."""
    print(f"Loading {len(transform)} records:")
    for record in transform:
        print(f"  - {record['name']}: {record['grade']}")
    return len(transform)

# Run the pipeline
if __name__ == "__main__":
    result = pipeline.run()
    print(f"\n✓ Processed {result.records_count} records in {result.duration:.2f}s")
```

Run it:

```bash
python my_pipeline.py
```

Output:

```
Loading 3 records:
  - Alice: B
  - Bob: A
  - Charlie: C

✓ Processed 3 records in 0.01s
```

## Using the CLI

Save your pipeline to a file and use the Mosayc CLI:

```bash
# Run a pipeline
mosayc run my_pipeline.py

# Visualize the task graph
mosayc visualize my_pipeline.py

# Dry run (validate without executing)
mosayc run my_pipeline.py --dry-run
```

## Adding Real Connectors

Let's upgrade to use actual database connectors:

```python
from mosayc import Pipeline
from mosayc.connectors import PostgresSource, PostgresSink

pipeline = Pipeline("database-etl")

# Configure source
source = PostgresSource(
    host="localhost",
    database="source_db",
    user="postgres",
)

# Configure sink
sink = PostgresSink(
    host="localhost",
    database="target_db",
    table="processed_users",
    user="postgres",
)

@pipeline.task
def extract():
    """Extract users from source database."""
    return source.query("SELECT * FROM users WHERE active = true")

@pipeline.task(depends_on=["extract"])
def transform(extract):
    """Enrich user data."""
    return [
        {
            **user,
            "full_name": f"{user['first_name']} {user['last_name']}",
            "processed_at": datetime.now().isoformat(),
        }
        for user in extract
    ]

@pipeline.task(depends_on=["transform"])
def load(transform):
    """Write to target database."""
    return sink.write(transform)
```

## Adding LLM Processing

Process text with OpenAI:

```python
from mosayc import Pipeline
from mosayc.connectors import OpenAITransform

pipeline = Pipeline("text-enrichment")
llm = OpenAITransform(model="gpt-4-turbo-preview")

@pipeline.task
def get_documents():
    return [
        {"id": 1, "content": "Mosayc is a Python framework for data pipelines."},
        {"id": 2, "content": "It supports LLMs, vector databases, and more."},
    ]

@pipeline.task(depends_on=["get_documents"])
def summarize(get_documents):
    """Generate summaries using GPT-4."""
    results = []
    for doc in get_documents:
        response = llm.generate(
            f"Summarize in one sentence: {doc['content']}",
            max_tokens=100,
        )
        results.append({
            **doc,
            "summary": response.content,
            "tokens_used": response.tokens_input + response.tokens_output,
        })
    return results
```

## Building a RAG Pipeline

Create a complete RAG ingestion pipeline:

```python
from mosayc import Pipeline
from mosayc.connectors import PostgresSource, PineconeSink, OpenAITransform
from mosayc.transforms import ChunkText

pipeline = Pipeline("rag-ingestion")

# Initialize connectors
source = PostgresSource(database="docs")
embedder = OpenAITransform(embedding_model="text-embedding-3-small")
vector_db = PineconeSink(index_name="documents")

@pipeline.task
def extract_documents():
    """Pull documents from database."""
    return source.query("SELECT id, title, content FROM articles")

@pipeline.task(depends_on=["extract_documents"])
def chunk_documents(extract_documents):
    """Split documents into chunks."""
    chunker = ChunkText(chunk_size=512, overlap=50)
    return chunker.transform(extract_documents)

@pipeline.task(depends_on=["chunk_documents"])
def generate_embeddings(chunk_documents):
    """Create embeddings for each chunk."""
    return embedder.transform(chunk_documents)

@pipeline.task(depends_on=["generate_embeddings"])
def store_vectors(generate_embeddings):
    """Upsert vectors to Pinecone."""
    vectors = [
        {
            "id": f"{doc['id']}_{doc['_chunk_index']}",
            "values": doc["embedding"],
            "metadata": {"title": doc["title"], "content": doc["content"]},
        }
        for doc in generate_embeddings
    ]
    return vector_db.upsert(vectors)

if __name__ == "__main__":
    result = pipeline.run()
    print(f"Ingested {result.records_count} vectors")
```

## Adding Observability

Enable tracing to see what's happening:

```python
from mosayc import Pipeline
from mosayc.observability import MosaycTracer

# Create tracer
tracer = MosaycTracer(
    endpoint="https://telemetry.mosayc.dev",
    project_id="my-project",
)

# Attach to pipeline
pipeline = Pipeline("observable-pipeline", tracer=tracer)

@pipeline.task
def process_data():
    # Tasks are automatically traced
    return do_work()
```

View traces in the Mosayc Dashboard at `https://app.mosayc.dev`.

## Error Handling

Add retry policies for resilience:

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
def flaky_api_call():
    """This task will retry on failure."""
    return external_api.fetch_data()
```

## Next Steps

- [Core Concepts](/concepts/pipelines) - Deep dive into pipelines and tasks
- [Connectors Guide](/guides/connectors) - Learn about all available connectors
- [Observability](/guides/observability) - Set up monitoring and tracing
- [Examples](/examples) - More complete examples
