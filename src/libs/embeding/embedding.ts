import axios from 'axios';
import { EMBEDDING_ENV } from '../env';

type EmbeddingResponse = {
  data: {
    embedding: number[];
  }[];
};

export async function getEmbedding(texts: string[]): Promise<number[][]> {
  try {
    const res = await axios.post<EmbeddingResponse>(
      EMBEDDING_ENV.URL,
      {
        model: EMBEDDING_ENV.MODEL,
        encoding_format: EMBEDDING_ENV.ENCODING_FORMAT,
        user: 'string',
        dimensions: EMBEDDING_ENV.DIM,
        input: texts,
      },
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${EMBEDDING_ENV.API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // 👉 提取 embedding
    return res.data.data.map(item => item.embedding);

  } catch (err: any) {
    console.error('embedding 请求失败', err.response?.data || err.message);
    throw err;
  }
}