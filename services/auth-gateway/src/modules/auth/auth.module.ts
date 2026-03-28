import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenService } from './refresh-token.service';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            privateKey: readFileSync(join(process.cwd(), 'keys', 'private.pem'), 'utf8'),
            publicKey: readFileSync(join(process.cwd(), 'keys', 'public.pem'), 'utf8'),
            signOptions: {
                expiresIn: '15m',
                algorithm: 'RS256',
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, RefreshTokenService],
    exports: [AuthService],
})
export class AuthModule { }
