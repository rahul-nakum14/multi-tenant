import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.interface';

export default registerAs(
    'app',
    (): AppConfig => ({
        nodeEnv: process.env.NODE_ENV as AppConfig['nodeEnv'],
        port: Number(process.env.PORT),
        database: {
            url: process.env.DATABASE_URL!,
            logging: process.env.DATABASE_LOGGING === 'true',
        },
        redis: {
            url: process.env.REDIS_URL!,
        },
        jwt: {
            secret: '',
            expiry: process.env.JWT_EXPIRY!,
            refreshExpiry: process.env.JWT_REFRESH_EXPIRY!,
        },
    }),
);
