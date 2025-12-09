---
sidebar_position: 1
---

# RAG Pipeline Example

Build a complete Retrieval-Augmented Generation (RAG) pipeline that ingests documents, generates embeddings, and stores them in a vector database for semantic search.

## Overview

This example demonstrates:
- Reading documents from PostgreSQL
- Chunking text for embedding
- Generating embeddings with OpenAI
- Storing vectors in Pinecone
- Full observability with tracing

## Prerequisites

```bash
pip install mosayc[postgres,openai,pinecone]
```

Set environment variables:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/docs"
export OPENAI_API_KEY="sk-..."
export PINECONE_API_KEY="..."
export PINECONE_INDEX="documents"
```

## Complete Pipeline

```python
"""
RAG Document Ingestion Pipeline

Ingests documents from a database, chunks them, generates embeddings,
and stores them in Pinecone for semantic search.
"""

import os
from datetime import datetime

from mosayc import Pipeline, Context, RetryPolicy, CachePolicy
from mosayc.connectors import PostgresSource, PineconeSink, OpenAITransform
from mosayc.transforms import ChunkText, CleanText, FilterEmpty
from mosayc.observability import MosaycTracer

# Initialize tracer for observability
tracer = MosaycTracer(
    endpoint="https://telemetry.mosayc.dev",
    project_id=os.getenv("MOSAYC_PROJECT_ID"),
)

# Create pipeline
pipeline = Pipeline(
    name="rag-document-ingestion",
    description="Ingest documents for RAG retrieval",
    version="1.0.0",
    tracer=tracer,
    execution_mode="sequential",
    fail_fast=True,
)

# Configure connectors
db_source = PostgresSource(
    connection_url=os.getenv("DATABASE_URL"),
)

embedder = OpenAITransform(
    model="gpt-4-turbo-preview",
    embedding_model="text-embedding-3-small",
)

vector_sink = PineconeSink(
    index_name=os.getenv("PINECONE_INDEX"),
    namespace="production",
    batch_size=100,
)


@pipeline.task
def extract_documents():
    """
    Extract unprocessed documents from the database.

    Returns documents that haven't been embedded yet,
    ordered by creation date.
    """
    query = """
        SELECT
            id,
            title,
            content,
            category,
            author,
            created_at
        FROM documents
        WHERE embedding_status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1000
    """
    return db_source.query(query)


@pipeline.task(depends_on=["extract_documents"])
def clean_documents(extract_documents):
    """
    Clean and normalize document text.

    Removes HTML, extra whitespace, and filters out
    documents with empty content.
    """
    cleaner = CleanText(
        text_field="content",
        remove_html=True,
        remove_urls=True,
        remove_extra_whitespace=True,
        min_length=50,  # Skip very short documents
    )

    cleaned = cleaner.transform(extract_documents)

    # Filter out empty documents
    filter_empty = FilterEmpty(fields=["content"])
    return filter_empty.transform(cleaned)


@pipeline.task(depends_on=["clean_documents"])
def chunk_documents(clean_documents):
    """
    Split documents into chunks for embedding.

    Uses overlapping chunks to maintain context
    across chunk boundaries.
    """
    chunker = ChunkText(
        chunk_size=512,      # Characters per chunk
        overlap=50,          # Overlap between chunks
        text_field="content",
        separator=" ",
    )

    chunks = chunker.transform(clean_documents)

    # Add metadata to each chunk
    for chunk in chunks:
        chunk["chunk_id"] = f"{chunk['id']}_{chunk['_chunk_index']}"
        chunk["source_doc_id"] = chunk["id"]

    return chunks


@pipeline.task(
    depends_on=["chunk_documents"],
    retry_policy=RetryPolicy(
        max_attempts=3,
        backoff="exponential",
        base_delay=1.0,
    ),
)
def generate_embeddings(chunk_documents):
    """
    Generate embeddings for each chunk using OpenAI.

    Includes retry logic for API rate limits and
    caches results to avoid duplicate API calls.
    """
    return embedder.transform(
        chunk_documents,
        text_field="content",
        output_field="embedding",
    )


@pipeline.task(depends_on=["generate_embeddings"])
def prepare_vectors(generate_embeddings):
    """
    Format chunks for vector database insertion.

    Creates the vector record structure expected by Pinecone.
    """
    vectors = []

    for chunk in generate_embeddings:
        vector = {
            "id": chunk["chunk_id"],
            "values": chunk["embedding"],
            "metadata": {
                "source_doc_id": chunk["source_doc_id"],
                "title": chunk.get("title", ""),
                "category": chunk.get("category", ""),
                "author": chunk.get("author", ""),
                "content": chunk["content"][:1000],  # Store truncated content
                "chunk_index": chunk["_chunk_index"],
                "created_at": chunk.get("created_at", datetime.now().isoformat()),
            },
        }
        vectors.append(vector)

    return vectors


@pipeline.task(depends_on=["prepare_vectors"])
def store_vectors(prepare_vectors):
    """
    Upsert vectors to Pinecone.

    Uses batch upsert for efficiency.
    """
    return vector_sink.upsert(prepare_vectors)


@pipeline.task(depends_on=["store_vectors", "extract_documents"])
def update_status(store_vectors, extract_documents):
    """
    Mark documents as processed in the database.
    """
    doc_ids = [doc["id"] for doc in extract_documents]

    if doc_ids:
        update_query = """
            UPDATE documents
            SET embedding_status = 'completed',
                embedded_at = NOW()
            WHERE id = ANY(%s)
        """
        db_source._connection.execute(update_query, (doc_ids,))

    return len(doc_ids)


# Entry point
if __name__ == "__main__":
    # Create context with configuration
    ctx = Context(env=os.getenv("ENVIRONMENT", "development"))

    # Run the pipeline
    result = pipeline.run(context=ctx)

    # Print results
    print("\n" + "=" * 50)
    print(f"Pipeline: {result.pipeline_name}")
    print(f"Status: {'✓ Completed' if result.succeeded else '✗ Failed'}")
    print(f"Duration: {result.duration:.2f}s")
    print(f"Documents processed: {result.records_count}")
    print("=" * 50)

    # Print task breakdown
    print("\nTask Results:")
    for task_name, task_result in result.task_results.items():
        status = "✓" if task_result.succeeded else "✗"
        records = task_result.records_processed or "-"
        print(f"  {status} {task_name}: {task_result.duration:.2f}s ({records} records)")
```

## Querying the Index

After ingestion, query the vector database:

```python
from mosayc.connectors import PineconeSource, OpenAITransform

# Initialize
source = PineconeSource(
    index_name=os.getenv("PINECONE_INDEX"),
    namespace="production",
)
embedder = OpenAITransform()

def search(query: str, top_k: int = 5):
    """Search for relevant documents."""
    # Generate query embedding
    query_embedding = embedder.embed([query]).embeddings[0]

    # Search Pinecone
    results = source.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
    )

    return [
        {
            "title": r.metadata.get("title"),
            "content": r.metadata.get("content"),
            "score": r.score,
        }
        for r in results
    ]

# Example search
results = search("How do I configure authentication?")
for r in results:
    print(f"{r['title']} (score: {r['score']:.3f})")
    print(f"  {r['content'][:200]}...")
```

## Using the Pre-built RAGPipeline

Mosayc also provides a pre-built RAG pipeline:

```python
from mosayc.pipelines import RAGPipeline
from mosayc.connectors import PostgresSource, PineconeSink, OpenAITransform

# Quick setup
rag = RAGPipeline(
    source=PostgresSource(connection_url=os.getenv("DATABASE_URL")),
    sink=PineconeSink(index_name="documents"),
    embedder=OpenAITransform(),
    chunk_size=512,
    chunk_overlap=50,
)

result = rag.run()
```

## Running with the CLI

Save the pipeline and run:

```bash
# Run the pipeline
mosayc run rag_pipeline.py

# Dry run to validate
mosayc run rag_pipeline.py --dry-run

# Run in production mode
mosayc run rag_pipeline.py --env production
```

## Monitoring

View pipeline execution in the Mosayc Dashboard:

1. Go to https://app.mosayc.dev
2. Select your project
3. View the trace for detailed execution timeline
4. Monitor:
   - Document processing throughput
   - Embedding generation latency
   - Vector upsert performance
   - Token usage and costs

## Next Steps

- [Connectors Guide](/guides/connectors) - Learn about available connectors
- [Observability Guide](/guides/observability) - Monitor your pipelines
- [Pipeline API Reference](/api/pipeline-reference) - Full API documentation
