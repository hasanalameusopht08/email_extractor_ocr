import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || 5000,
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'email_extractor',
        port: process.env.DB_PORT || 3306
    },
    nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;
