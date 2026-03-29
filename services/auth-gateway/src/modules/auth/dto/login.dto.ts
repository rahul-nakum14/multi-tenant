import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'SecureP@ss123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
