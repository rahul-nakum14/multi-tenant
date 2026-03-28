import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import type { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        const publicKey = readFileSync(
            join(process.cwd(), 'keys', 'public.pem'),
            'utf8',
        );

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request?.cookies?.['access_token'],
            ]),
            ignoreExpiration: false,
            secretOrKey: publicKey,
            algorithms: ['RS256'],
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
        if (!payload.tenant_id) {
            throw new Error('JWT missing tenant_id');
        }

        const user = await this.authService.validateUser(payload.sub, payload.tenant_id);

        req.tenantId = user.tenantId;

        return user;
    }
}
