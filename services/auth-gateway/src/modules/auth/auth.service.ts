import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenService } from './refresh-token.service';
import { BCRYPT_SALT_ROUNDS, DEFAULT_USER_ROLE, ROLE_SCOPES } from '../../common/constants';
import type {
    JwtPayload,
    AuthenticatedUser,
    TokenPair,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
    ) { }

    async register(dto: RegisterDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email, tenantId: dto.tenantId },
        });

        if (existingUser) {
            throw new ConflictException('User already exists in this tenant');
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
        const user = this.userRepository.create({
            email: dto.email,
            passwordHash,
            tenantId: dto.tenantId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: DEFAULT_USER_ROLE,
        });

        const saved = await this.userRepository.save(user);
        const tokens = await this.issueTokenPair(saved);

        return { user: this.mapToAuthenticatedUser(saved), tokens };
    }

    async login(dto: LoginDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
        const user = await this.userRepository.findOne({
            where: { email: dto.email },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.issueTokenPair(user);
        return { user: this.mapToAuthenticatedUser(user), tokens };
    }

    async refresh(
        userId: string,
        sessionId: string,
        incomingRefreshToken: string,
    ): Promise<TokenPair> {
        const { token: newRefreshToken, sessionId: newSessionId } =
            await this.refreshTokenService.rotate(userId, sessionId, incomingRefreshToken);

        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });

        if (!user) {
            await this.refreshTokenService.revoke(userId, newSessionId);
            throw new UnauthorizedException('User not found or inactive');
        }

        const accessToken = await this.buildAccessToken(user);

        return { accessToken, refreshToken: newRefreshToken, sessionId: newSessionId };
    }

    async logout(userId: string, sessionId: string): Promise<void> {
        await this.refreshTokenService.revoke(userId, sessionId);
    }

    async validateUser(userId: string, tenantId: string): Promise<AuthenticatedUser> {
        const user = await this.userRepository.findOne({
            where: { id: userId, tenantId, isActive: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return this.mapToAuthenticatedUser(user);
    }

    private async issueTokenPair(user: User): Promise<TokenPair> {
        const [accessToken, { token: refreshToken, sessionId }] = await Promise.all([
            this.buildAccessToken(user),
            this.refreshTokenService.issue(user.id),
        ]);

        return { accessToken, refreshToken, sessionId };
    }

    async buildAccessToken(user: User): Promise<string> {
        const payload: JwtPayload = {
            sub: user.id,
            tenant_id: user.tenantId,
            role: user.role,
            scope: ROLE_SCOPES[user.role] ?? ROLE_SCOPES['viewer'],
        };
        return this.jwtService.sign(payload);
    }

    private mapToAuthenticatedUser(user: User): AuthenticatedUser {
        return {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
}
