import { ConnectMilvusClient, client } from '../../../../libs/milvus';

/**
 * 连接 Milvus 数据库
 * @param req 
 * @returns 连接成功后的 JSON 响应
 */    
export async function POST(req: Request) {
    const body = await req.json();
    const db = body.db as string;
    const url = body.url as string;
    const username = body.username as string;
    const password = body.password as string;
    if (client) {
        return new Response('Milvus client has initialized', { status: 500 });
    }
    await ConnectMilvusClient(db, url, username, password);
    return Response.json({ message: 'Connected to Milvus successfully' });
}