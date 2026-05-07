import { DeleteMilvusCollection, client } from '../../../../libs/milvus';

/**
 * 创建 collection
 * @param req 包含 collectionName 的 JSON 请求体
 * @returns 创建 collection 成功的 JSON 响应
 */    
export async function POST(req: Request) {
    const body = await req.json();
    const collectionName = body.collectionName as string;
    if (!client) {
        return new Response('Milvus client not initialized', { status: 500 });
    }
    await DeleteMilvusCollection(client, collectionName);
    return Response.json({ message: 'Collection deleted successfully' });
}
