---
sidebar_position: 1
---

# Connectors Guide

Connectors are pre-built integrations for databases, APIs, and services. They implement the Source and Sink interfaces for reading and writing data.

## Database Connectors

### PostgreSQL

```python
from mosayc.connectors import PostgresSource, PostgresSink

# Source - reading data
source = PostgresSource(
    host="localhost",
    port=5432,
    database="mydb",
    user="postgres",
    password="secret",
)

# Query data
users = source.query("SELECT * FROM users WHERE active = true")

# Or use table method
users = source.table("users", columns=["id", "name", "email"]).read()

# Sink - writing data
sink = PostgresSink(
    table="processed_users",
    database="analytics",
    user="postgres",
)

sink.write([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
])
```

### Connection URLs

```python
source = PostgresSource(
    connection_url="postgresql://user:pass@host:5432/database"
)
```

### MongoDB

```python
from mosayc.connectors import MongoDBSource, MongoDBSink

source = MongoDBSource(
    uri="mongodb://localhost:27017",
    database="mydb",
    collection="documents",
)

# Filter documents
docs = source.filter({"status": "active"}).read()

# Write to MongoDB
sink = MongoDBSink(
    uri="mongodb://localhost:27017",
    database="mydb",
    collection="processed",
)
sink.write(processed_docs)
```

## Vector Database Connectors

### Pinecone

```python
from mosayc.connectors import PineconeSource, PineconeSink

# Query similar vectors
source = PineconeSource(
    api_key="your-api-key",
    index_name="documents",
    namespace="production",
)

results = source.query(
    vector=[0.1, 0.2, 0.3, ...],  # Query embedding
    top_k=10,
    filter={"category": "tech"},
    include_metadata=True,
)

# Upsert vectors
sink = PineconeSink(
    index_name="documents",
    namespace="production",
)

sink.upsert([
    {
        "id": "doc-1",
        "vector": [0.1, 0.2, ...],
        "metadata": {"title": "Hello World", "category": "tech"},
    },
])
```

### Qdrant

```python
from mosayc.connectors import QdrantSource, QdrantSink

source = QdrantSource(
    url="http://localhost:6333",
    collection_name="documents",
)

results = source.query(
    vector=[0.1, 0.2, ...],
    top_k=10,
    filter={"must": [{"key": "category", "match": {"value": "tech"}}]},
)
```

### Chroma

```python
from mosayc.connectors import ChromaSource, ChromaSink

source = ChromaSource(
    collection_name="documents",
    persist_directory="./chroma_data",
)

# Query by text (Chroma generates embeddings)
results = source.query(
    query_texts=["What is machine learning?"],
    n_results=5,
)
```

## LLM Provider Connectors

### OpenAI

```python
from mosayc.connectors import OpenAITransform

llm = OpenAITransform(
    model="gpt-4-turbo-preview",
    embedding_model="text-embedding-3-small",
    temperature=0.7,
    max_tokens=4096,
)

# Generate text
response = llm.generate(
    prompt="Explain quantum computing",
    system_prompt="You are a helpful science teacher.",
)
print(response.content)
print(f"Tokens: {response.tokens_input + response.tokens_output}")

# Generate embeddings
embeddings = llm.embed(["Hello world", "Goodbye world"])
print(f"Dimensions: {embeddings.dimensions}")  # 1536

# Transform records (add embeddings)
records = [{"id": 1, "content": "Hello"}, {"id": 2, "content": "World"}]
embedded = llm.transform(records, text_field="content", output_field="embedding")
```

### Anthropic Claude

```python
from mosayc.connectors import AnthropicTransform

llm = AnthropicTransform(
    model="claude-3-opus-20240229",
    max_tokens=4096,
)

response = llm.generate(
    prompt="Write a haiku about programming",
    system_prompt="You are a creative poet.",
)
```

### Cohere

```python
from mosayc.connectors import CohereTransform

llm = CohereTransform(
    model="command",
    embedding_model="embed-english-v3.0",
)

# Cohere embeddings support input types
embeddings = llm.embed(
    texts=["search query"],
    input_type="search_query",  # or "search_document"
)
```

### HuggingFace (Local)

```python
from mosayc.connectors import HuggingFaceTransform

# Run embeddings locally
embedder = HuggingFaceTransform(
    model="sentence-transformers/all-MiniLM-L6-v2",
    device="cuda",  # or "cpu"
)

embeddings = embedder.embed(["Local embedding generation"])
```

## Cloud Storage Connectors

### Amazon S3

```python
from mosayc.connectors import S3Source, S3Sink

source = S3Source(
    bucket="my-bucket",
    prefix="data/raw/",
    region="us-east-1",
)

# List objects
keys = source.list_objects()

# Read objects
for obj in source.read():
    print(obj["key"], len(obj["content"]))

# Write to S3
sink = S3Sink(bucket="my-bucket", prefix="data/processed/")
sink.write([
    {"key": "output.json", "content": json.dumps(data)},
])
```

### Local Filesystem

```python
from mosayc.connectors import LocalFileSource, LocalFileSink

# Read files matching pattern
source = LocalFileSource(
    path="./data",
    pattern="*.json",
    recursive=True,
)

for file in source.read():
    print(file["name"], file["size"])

# Write files
sink = LocalFileSink(path="./output")
sink.write([
    {"name": "result.json", "content": json.dumps(data)},
])
```

## Message Queue Connectors

### Apache Kafka

```python
from mosayc.connectors import KafkaSource, KafkaSink

# Consume messages
source = KafkaSource(
    bootstrap_servers="localhost:9092",
    topic="events",
    group_id="mosayc-consumer",
    auto_offset_reset="earliest",
)

for message in source.read():
    print(message["value"])

# Produce messages
sink = KafkaSink(
    bootstrap_servers="localhost:9092",
    topic="processed-events",
)

sink.write([
    {"user_id": 123, "action": "click"},
    {"user_id": 456, "action": "purchase"},
])
```

### Redis Streams

```python
from mosayc.connectors import RedisStreamSource, RedisStreamSink

source = RedisStreamSource(
    url="redis://localhost:6379",
    stream="events",
    consumer_group="mosayc",
)

# Consume with acknowledgment
for message in source.read():
    process(message["data"])
    # Auto-acknowledged after yield

sink = RedisStreamSink(
    url="redis://localhost:6379",
    stream="processed",
    maxlen=10000,  # Trim stream
)
sink.write(records)
```

## Creating Custom Connectors

### Custom Source

```python
from mosayc.core.source import Source
from typing import Iterator, Dict, Any

class MyAPISource(Source[Dict[str, Any]]):
    def __init__(self, api_url: str, api_key: str):
        super().__init__()
        self.api_url = api_url
        self.api_key = api_key

    def connect(self):
        self._client = create_client(self.api_url, self.api_key)
        self._is_connected = True

    def read(self) -> Iterator[Dict[str, Any]]:
        if not self._is_connected:
            self.connect()

        for page in self._client.paginate():
            for record in page:
                yield record
```

### Custom Sink

```python
from mosayc.core.sink import Sink
from typing import List, Dict, Any

class MyAPISink(Sink[Dict[str, Any]]):
    def __init__(self, api_url: str):
        super().__init__()
        self.api_url = api_url

    def write(self, records: List[Dict[str, Any]]) -> int:
        if not self._is_connected:
            self.connect()

        response = self._client.bulk_insert(records)
        written = response["inserted_count"]
        self._metrics.records_written += written
        return written
```

## Best Practices

### 1. Use Context Managers

```python
with PostgresSource(...) as source:
    data = list(source.read())
# Connection automatically closed
```

### 2. Batch Large Writes

```python
# Good - batch writes
for batch in source.read_batch(batch_size=1000):
    sink.write(batch)

# Bad - write one at a time
for record in source.read():
    sink.write([record])
```

### 3. Handle Connection Errors

```python
from mosayc.core.errors import ConnectorError

try:
    source.connect()
except ConnectorError as e:
    logger.error(f"Connection failed: {e}")
    raise
```

### 4. Use Environment Variables

```python
source = PostgresSource(
    host=os.getenv("DB_HOST"),
    password=os.getenv("DB_PASSWORD"),
)
```

## Next Steps

- [Observability Guide](/guides/observability) - Monitor connector performance
- [API Reference](/api/connectors) - Full connector API documentation
