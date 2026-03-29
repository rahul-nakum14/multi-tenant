import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        RedisService,
        {
            provide: REDIS_CLIENT,
            inject: [RedisService],
            useFactory: (redisService: RedisService): Redis => redisService.client,
        },
    ],
    exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule { }
