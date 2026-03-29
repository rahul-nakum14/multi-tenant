import { Controller, Get, Inject } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    TypeOrmHealthIndicator,
    HealthCheckResult,
    HealthIndicatorResult,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ) { }

    @Get()
    liveness(): { status: string } {
        return { status: 'ok' };
    }

    @Get('ready')
    @HealthCheck()
    readiness(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.checkRedis(),
        ]);
    }

    private async checkRedis(): Promise<HealthIndicatorResult> {
        try {
            await this.redis.ping();
            return { redis: { status: 'up' } };
        } catch {
            return { redis: { status: 'down' } };
        }
    }
}
