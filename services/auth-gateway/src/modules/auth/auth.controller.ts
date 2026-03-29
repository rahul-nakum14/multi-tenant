import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    SESSION_ID_COOKIE,
    ACCESS_TOKEN_TTL_MS,
    REFRESH_TOKEN_TTL_MS,
    REFRESH_COOKIE_PATH,
    SESSION_COOKIE_PATH,
} from '../../common/constants';

const IS_PROD = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.register(dto);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.sessionId);
        return { success: true, user };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.login(dto);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.sessionId);
        return { success: true, user };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rotate refresh token and reissue access token' })
    @ApiResponse({ status: 200, description: 'Tokens rotated' })
    @ApiResponse({ status: 401, description: 'Refresh token invalid, expired, or replayed' })
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];
        const sessionId: string | undefined = req.cookies?.[SESSION_ID_COOKIE];
        const rawAccess: string | undefined = req.cookies?.[ACCESS_TOKEN_COOKIE];
        const userId = this.extractSubFromRawToken(rawAccess);

        if (!refreshToken || !sessionId || !userId) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                error: { code: 'MISSING_TOKENS', message: 'Refresh token or session missing' },
            });
        }

        const tokens = await this.authService.refresh(userId, sessionId, refreshToken);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.sessionId);
        return { success: true };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, TenantGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout (revokes refresh token)' })
    @ApiResponse({ status: 200, description: 'Logged out' })
    async logout(
        @CurrentUser() user: AuthenticatedUser,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const sessionId: string | undefined = req.cookies?.[SESSION_ID_COOKIE];
        if (sessionId) {
            await this.authService.logout(user.id, sessionId);
        }
        this.clearAuthCookies(res);
        return { success: true, message: 'Logged out successfully' };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, TenantGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Current user' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Tenant invalid or missing' })
    getProfile(@CurrentUser() user: AuthenticatedUser) {
        return { success: true, user };
    }

    private setAuthCookies(
        res: Response,
        accessToken: string,
        refreshToken: string,
        sessionId: string,
    ): void {
        res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
            ...BASE_COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_TTL_MS,
        });

        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
            ...BASE_COOKIE_OPTIONS,
            path: REFRESH_COOKIE_PATH,
            maxAge: REFRESH_TOKEN_TTL_MS,
        });

        res.cookie(SESSION_ID_COOKIE, sessionId, {
            ...BASE_COOKIE_OPTIONS,
            path: SESSION_COOKIE_PATH,
            maxAge: REFRESH_TOKEN_TTL_MS,
        });
    }

    private clearAuthCookies(res: Response): void {
        res.clearCookie(ACCESS_TOKEN_COOKIE, BASE_COOKIE_OPTIONS);
        res.clearCookie(REFRESH_TOKEN_COOKIE, { ...BASE_COOKIE_OPTIONS, path: REFRESH_COOKIE_PATH });
        res.clearCookie(SESSION_ID_COOKIE, { ...BASE_COOKIE_OPTIONS, path: SESSION_COOKIE_PATH });
    }

    private extractSubFromRawToken(token: string | undefined): string | null {
        if (!token) return null;
        try {
            const [, payload] = token.split('.');
            const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            return typeof decoded?.sub === 'string' ? decoded.sub : null;
        } catch {
            return null;
        }
    }
}
