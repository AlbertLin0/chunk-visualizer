import { client, DisconnectMilvusClient } from '../../../../libs/milvus';

export async function POST(req: Request) {
    if (!client) {
        return new Response('Milvus client not initialized', { status: 500 });
    }
    await DisconnectMilvusClient();
    return Response.json({ message: 'Milvus client disconnected successfully' });
}