# Chunk Visualizer

This project provides a playground for visual comparison of different text chunking algorithms.

Chunk Visualizer is an interactive tool for experimenting with document chunking strategies in Retrieval-Augmented Generation (RAG) systems.

The project allows users to freely split and customize chunks from documents, store them in Milvus, and perform semantic retrieval to analyze search performance in real time.

With Chunk Visualizer, you can:

- Freely adjust chunk size and chunk boundaries
- Compare different chunking strategies
- Store embeddings in Milvus
- Perform vector similarity search
- Inspect retrieval scores and returned results
- Observe how chunk design impacts retrieval quality and relevance

The goal of this project is to help developers better understand how chunking affects RAG performance and discover the optimal chunking strategy for their own applications.

I am a noobie of typescript. if you have a better way to write the code, please push a PR.


<img width="1452" height="819" alt="image" src="https://github.com/user-attachments/assets/fc86f62e-b2ea-415e-9c96-e40d3cdc4841" />

## Env

config env variables:

```
DB_URL=http://10.16.6.191:19530
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=chunkStrategy
DB_VECTOR_DIM=1024
# DB_INDEX_TYPE=HNSW

EMBEDDING_URL=http://10.16.6.191:7997/embeddings
EMBEDDING_API_KEY=
EMBEDDING_MODEL=models/bge-large-zh-v1.5
EMBEDDING_ENCODING_FORMAT=float
EMBEDDING_DIM=1024
```

## Libraries

### [chunkdown](https://github.com/zirkelc/chunkdown)

Available algorithms:
- `markdown`

### [@langchain/textsplitters](https://www.npmjs.com/package/@langchain/textsplitters)

Available algorithms:
- `markdown`
- `character`
- `sentence`

### [llamaindex](https://www.npmjs.com/package/llamaindex)

Available algorithms:
- `sentence`
- `markdown`

### ~~[@mastra/rag](https://www.npmjs.com/package/@mastra/rag)~~

> [!NOTE]
> Currently disabled due to compatibility issues: https://github.com/mastra-ai/mastra/issues/9389

Available algorithms:
- `recursive`
- `character`
- `markdown`

## Contributing

Want to add a new library? See [CONTRIBUTING.md](./CONTRIBUTING.md) for a step-by-step guide.

## License

MIT
