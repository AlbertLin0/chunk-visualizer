import { expect, test, describe } from 'vitest';
import { getEmbedding } from '../libs/embeding/embedding';

describe('embedding 测试', () => {
    test('获取 embedding', async () => {
        const texts = ['你好', '你好吗'];
        const embeddings = await getEmbedding(texts);
        expect(embeddings).toHaveLength(texts.length);
    })
})