export enum UserRole {
    ADMIN = 'admin',
    MEMBER = 'member',
    VIEWER = 'viewer',
}

export const BCRYPT_SALT_ROUNDS = 12;
export const DEFAULT_USER_ROLE = UserRole.MEMBER;

export const ROLE_SCOPES: Record<string, string> = {
    [UserRole.ADMIN]: 'read:all write:all delete:all',
    [UserRole.MEMBER]: 'read:own write:own',
    [UserRole.VIEWER]: 'read:own',
};
