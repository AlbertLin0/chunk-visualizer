import dotenv from 'dotenv';

dotenv.config();

export const DB_ENV = {
    API_URL: process.env.DB_URL!,
    USERNAME: process.env.DB_USERNAME!,
    PASSWORD: process.env.DB_PASSWORD!,
    DATABASE: process.env.DB_DATABASE!,
    VECTOR_DIM: Number(process.env.DB_VECTOR_DIM!),
}


export const EMBEDDING_ENV = {
    URL: process.env.EMBEDDING_URL!,
    API_KEY: process.env.EMBEDDING_API_KEY!,
    MODEL: process.env.EMBEDDING_MODEL!,
    DIM: Number(process.env.EMBEDDING_DIM!),
    ENCODING_FORMAT: process.env.EMBEDDING_ENCODING_FORMAT!,
}