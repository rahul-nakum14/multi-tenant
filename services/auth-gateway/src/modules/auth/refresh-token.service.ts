import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

@Injectable()
export class RefreshTokenService {
    private readonly REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
    private readonly HASH_ROUNDS = 10;

    private redisKey(userId: string, sessionId: string): string {
        return `refresh:${userId}:${sessionId}`;
    }

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    async issue(userId: string): Promise<{ token: string; sessionId: string }> {
        const token = crypto.randomBytes(64).toString('hex');
        const sessionId = crypto.randomBytes(16).toString('hex');
        const hashed = await bcrypt.hash(token, this.HASH_ROUNDS);

        await this.redis.set(
            this.redisKey(userId, sessionId),
            hashed,
            'EX',
            this.REFRESH_TTL_SECONDS,
        );

        return { token, sessionId };
    }

    async rotate(
        userId: string,
        sessionId: string,
        incomingToken: string,
    ): Promise<{ token: string; sessionId: string }> {
        const key = this.redisKey(userId, sessionId);
        const stored = await this.redis.get(key);

        if (!stored) {
            throw new UnauthorizedException('Refresh token invalid or expired');
        }

        const isValid = await bcrypt.compare(incomingToken, stored);
        if (!isValid) {
            await this.redis.del(key);
            throw new UnauthorizedException('Refresh token mismatch — session revoked');
        }

        await this.redis.del(key);
        return this.issue(userId);
    }

    async revoke(userId: string, sessionId: string): Promise<void> {
        await this.redis.del(this.redisKey(userId, sessionId));
    }

    async revokeAll(userId: string): Promise<void> {
        const pattern = this.redisKey(userId, '*');
        let cursor = '0';
        do {
            const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            if (keys.length) await this.redis.del(...keys);
            cursor = next;
        } while (cursor !== '0');
    }
}
