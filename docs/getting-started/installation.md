---
sidebar_position: 1
---

# Installation

This guide covers installing Mosayc and setting up your development environment.

## Requirements

- Python 3.9 or higher
- pip or poetry for package management

## Basic Installation

Install the core Mosayc package:

```bash
pip install mosayc
```

This includes the pipeline engine, core transforms, and CLI tools.

## Installing Connectors

Mosayc uses optional dependencies for connectors. Install only what you need:

### Database Connectors

```bash
# PostgreSQL
pip install mosayc[postgres]

# MySQL
pip install mosayc[mysql]

# MongoDB
pip install mosayc[mongodb]

# Snowflake
pip install mosayc[snowflake]

# BigQuery
pip install mosayc[bigquery]

# DynamoDB
pip install mosayc[dynamodb]
```

### Vector Database Connectors

```bash
# Pinecone
pip install mosayc[pinecone]

# Weaviate
pip install mosayc[weaviate]

# Qdrant
pip install mosayc[qdrant]

# Chroma
pip install mosayc[chroma]

# Milvus
pip install mosayc[milvus]
```

### LLM Provider Connectors

```bash
# OpenAI
pip install mosayc[openai]

# Anthropic
pip install mosayc[anthropic]

# Cohere
pip install mosayc[cohere]

# HuggingFace Transformers
pip install mosayc[huggingface]

# AWS Bedrock
pip install mosayc[bedrock]
```

### Cloud Storage

```bash
# Amazon S3
pip install mosayc[s3]

# Google Cloud Storage
pip install mosayc[gcs]

# Azure Blob Storage
pip install mosayc[azure]
```

### Message Queues

```bash
# Apache Kafka
pip install mosayc[kafka]

# RabbitMQ
pip install mosayc[rabbitmq]

# Redis Streams
pip install mosayc[redis]

# Amazon SQS
pip install mosayc[sqs]
```

### Installing Multiple Connectors

Combine extras in a single install:

```bash
pip install mosayc[postgres,openai,pinecone]
```

### Install Everything

For development or if you need all connectors:

```bash
pip install mosayc[all]
```

## Verifying Installation

Check that Mosayc is installed correctly:

```bash
mosayc --version
# mosayc, version 0.12.0
```

Try running a simple pipeline:

```python
from mosayc import Pipeline

pipeline = Pipeline("test")

@pipeline.task
def hello():
    return "Installation successful!"

result = pipeline.run()
print(result)
```

## Development Installation

For contributing to Mosayc or running from source:

```bash
# Clone the repository
git clone https://github.com/mosayc-dev/mosayc.git
cd mosayc

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest
```

## Environment Variables

Configure Mosayc using environment variables:

```bash
# Mosayc Configuration
export MOSAYC_PROJECT_ID="your-project-id"
export MOSAYC_API_KEY="your-api-key"

# LLM Providers
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Vector Databases
export PINECONE_API_KEY="..."
export PINECONE_ENVIRONMENT="us-west1-gcp"

# Databases
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

Or use a `.env` file with [python-dotenv](https://github.com/theskumar/python-dotenv).

## IDE Setup

### VS Code

Install the Python extension and create a `settings.json`:

```json
{
  "python.linting.enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "black"
}
```

### PyCharm

Mosayc includes type hints throughout. Enable type checking in:
`Settings > Editor > Inspections > Python > Type checker`

## Next Steps

- [Quick Start Tutorial](/getting-started/quickstart) - Build your first pipeline
- [Core Concepts](/concepts/pipelines) - Understand the fundamentals
- [Examples](/examples/rag-pipeline) - See real-world use cases
