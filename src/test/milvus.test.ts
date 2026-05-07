import { expect, test, describe } from 'vitest';
import { 
    CreateMilvusCollection,
    DeleteMilvusCollection,
    ConnectMilvusClient,
    BatchInsert, 
    VectorSearch,
    Insert,
    DataSchema,
    client,
} from '../libs/milvus';
import type { MilvusClient } from '@zilliz/milvus2-sdk-node';


describe('Milvus 生命周期测试', () => {
    test('链接数据库', async () => {
        ConnectMilvusClient();
        expect(client).toBeDefined();
        if (!client) {
            return;
        }
        const res = await client.showCollections();
        console.log("所有 collection:", res);
        console.log("链接数据库成功")
    })
    test('创建 collection', async () => {
        expect(client).toBeDefined();
        if (!client) {
            return;
        }
        await CreateMilvusCollection(client, "test1");
        console.log("创建 collection 成功")
    })
    test('插入数据', async () => {
        const data: DataSchema[] = [
            {
                text: "这是一条测试",
                vector: new Array(1024).fill(0.1),
            },
        ];
        expect(client).toBeDefined();
        if (!client) {
            return;
        }
        await Insert(client, "test1", data);
        console.log("插入数据成功")
    })
    test('向量搜索', async () => {
        expect(client).toBeDefined();
        if (!client) {
            return;
        }
        const res = await VectorSearch(client, "test1", "这是一条测试");
        console.log("向量搜索结果:", res);
        console.log(typeof res.results);
    })


    test('删除 collection', async () => {
        expect(client).toBeDefined();
        if (!client) {
            return;
        }
        await DeleteMilvusCollection(client, "test1");
        console.log("删除 collection 成功")
    })
})
