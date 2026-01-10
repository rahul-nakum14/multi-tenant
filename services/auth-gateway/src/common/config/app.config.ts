import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.interface';

export default registerAs(
    'app',
    (): AppConfig => ({
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        database: {
            url: process.env.DATABASE_URL!,
            logging: process.env.DATABASE_LOGGING === 'true',
        },
        redis: {
            url: process.env.REDIS_URL!,
        },
        jwt: {
            secret: process.env.JWT_SECRET!,
            expiry: process.env.JWT_EXPIRY || '15m',
            refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        },
    }),
);
