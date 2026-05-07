import {
  MilvusClient,
  DataType,
  MetricType,
} from '@zilliz/milvus2-sdk-node';
import { DB_ENV } from './env';
import { getEmbedding } from './embeding/embedding';


export let client: MilvusClient | null = null;

export async function DisconnectMilvusClient() {
    if (!client) {
        return;
    }
    await client.closeConnection();
    client = null;
}

/**
 * 创建并初始化 Milvus 客户端连接
 *
 * 该函数用于连接 Milvus 服务，并返回一个可用于后续操作（建表、插入、检索等）的客户端实例。
 * 通常作为向量数据库操作的入口函数使用。
 *
 * @param db - 数据库名称（默认使用环境变量 DB_ENV.DATABASE）
 * @param address - Milvus 服务地址，例如 "localhost:19530"
 * @param username - 登录用户名（如果开启鉴权）
 * @param password - 登录密码（如果开启鉴权）
 *
 * @returns Promise<MilvusClient> - 返回一个已连接的 Milvus 客户端实例
 *
 * @example
 * ```ts
 * const client = await ConnectMilvusClient();
 * ```
 *
 * @example 自定义参数
 * ```ts
 * const client = await ConnectMilvusClient(
 *   "my_db",
 *   "127.0.0.1:19530",
 *   "root",
 *   "Milvus",
 * );
 * ```
 *
 * @remarks
 * - 建议在测试环境中使用独立 collection，避免污染生产数据
 * - 该函数只负责连接，不包含 collection 创建或索引构建逻辑（需在外部处理）
 */
export async function ConnectMilvusClient(
    db: string = DB_ENV.DATABASE, 
    address: string = DB_ENV.API_URL,
    username: string = DB_ENV.USERNAME,
    password: string = DB_ENV.PASSWORD,
) : Promise<void> {

    client = new MilvusClient({ 
        address: address, 
        username: username,
        password: password,
        database: db,
    }); 
}

export async function DeleteMilvusCollection(
    client: MilvusClient,
    collection: string,
): Promise<void> {
    await client.dropCollection({ collection_name: collection });
}

export async function CreateMilvusCollection(
    client: MilvusClient,
    collection: string,
    text_length: number = 2048,
    index_type: string = "HNSW",    // 更改索引类型需要更改代码参数
    vector_dim: number = DB_ENV.VECTOR_DIM, // bge-large-zh-v1.5
    metric_type: MetricType = MetricType.COSINE,
    enable_dynamic_field: boolean = true,
    load: boolean = true,
): Promise<void> {
    // 检查 collection 是否已存在
    const has = await client.hasCollection({ collection_name: collection });

    if (has.value) {
        console.log(`collection ${collection} 已存在`);
        return;
    }

    // 创建 collection
    await client.createCollection({
        collection_name: collection,
        fields: [
            { name: 'id', data_type: DataType.Int64, is_primary_key: true, autoID: true },
            { name: 'text', data_type: DataType.VarChar, max_length: text_length },
            { name: 'vector', data_type: DataType.FloatVector, dim: vector_dim },
        ],
        index_params: [
            {
                field_name: 'vector',
                index_type: index_type,
                metric_type: metric_type,
                params: { M: 16, efConstruction: 256 },
            },
        ],
        enable_dynamic_field: enable_dynamic_field,
    });
 
    // 如果需要，加载到内存
    if (load) {
        await client.loadCollection({ collection_name: collection });
    }
}


export interface DataSchema {
    text: string;
    vector: number[];   // 没有长度限制，根据 vector_dim 来设置
    [key: string]: any;
}

// 批量插入配置
export interface BatchInsertOptions {
    batchSize?: number; // 每批插入的数量，默认 1000
    timeout?: number;   // 超时时间（毫秒）
}
 
/**
 * 批量插入数据到 Milvus Collection
 * @param client - 已连接的 MilvusClient 实例
 * @param collection - collection 名称
 * @param data - 要插入的数据数组
 * @param options - 批量插入配置
 * @returns 插入结果
 */
export async function BatchInsert(
    client: MilvusClient,
    collection: string,
    data: DataSchema[],
    options: BatchInsertOptions = {},
): Promise<any> {
    const { batchSize = 100 } = options;
    const results: any[] = [];
    const totalCount = data.length;
 
    // 分批插入
    for (let i = 0; i < totalCount; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, totalCount));
        
        await client.insert({
            collection_name: collection,
            data: batch,
        });
        
        // 可选：打印进度
        console.log(`已插入 ${Math.min(i + batchSize, totalCount)}/${totalCount} 条数据`);
    }
}

export async function Insert(
    client: MilvusClient,
    collection: string,
    data: DataSchema[],
): Promise<void> {
    try {
        // 为每个数据项计算 embedding
        const embeddings = await getEmbedding(data.map(item => item.text));
        // 合并数据项和 embedding
        data.forEach((item, index) => {
            item.vector = embeddings[index];
        });
        await client.insert({
            collection_name: collection,
            data: data,
        });
        await client.flush({ collection_names: [collection] });
        console.log("插入数据成功")
    } catch (error) {
        console.error("插入数据失败:", error);
    }
}

/**
 * 简化版向量搜索
 * @param client - 已连接的 MilvusClient 实例
 * @param collection - collection 名称
 * @param vector - 要搜索的向量
 * @param limit - 返回结果数量，默认 10
 * @returns 搜索结果
 */
export async function VectorSearch(
    client: MilvusClient,
    collection: string,
    text: string,
    limit: number = 10,
): Promise<any> {
    const embedding = await getEmbedding([text]);
    return client.search({
        collection_name: collection,
        vector: embedding[0],
        limit: limit,
        output_fields: ['text'],   // NOTE: 特定化输出字段 
    });
}

// /**
//  * 简化版BM25搜索
//  * @param client - 已连接的 MilvusClient 实例
//  * @param collection - collection 名称
//  * @param vector - 要搜索的向量
//  * @param limit - 返回结果数量，默认 10
//  * @returns 搜索结果
//  */
// export function BM25Search(
//     client: MilvusClient,
//     collection: string,
//     vector: number[],
//     limit: number = 10,
// ): Promise<any> {

// }
