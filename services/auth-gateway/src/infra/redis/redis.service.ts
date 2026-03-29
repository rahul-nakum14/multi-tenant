import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    readonly client: Redis;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('app.redis.url')!;

        const options: RedisOptions = {
            retryStrategy: (times: number) => {
                if (times > 10) {
                    this.logger.error(`Redis connection failed after ${times} attempts — giving up`);
                    return null;
                }
                const delay = Math.min(times * 200, 3000);
                this.logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            },
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: false,
        };

        this.client = new Redis(redisUrl, options);

        this.client.on('connect', () => this.logger.log('Redis connection established'));
        this.client.on('ready', () => this.logger.log('Redis client ready'));
        this.client.on('error', (err) => this.logger.error('Redis error', err.message));
        this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting'));
        this.client.on('close', () => this.logger.warn('Redis connection closed'));
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
        this.logger.log('Redis connection closed gracefully');
    }

    async healthCheck(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch {
            return false;
        }
    }
}
