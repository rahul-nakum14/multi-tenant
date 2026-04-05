-- Identity Service DB schema
-- Run this against identity_db BEFORE starting the service.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID         NOT NULL,
    email         TEXT         NOT NULL,
    first_name    TEXT         NOT NULL DEFAULT '',
    last_name     TEXT         NOT NULL DEFAULT '',
    password_hash TEXT         NOT NULL,
    role          TEXT         NOT NULL DEFAULT 'MEMBER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  UUID        NOT NULL,
    name       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id);

-- User <-> Organization membership
CREATE TABLE IF NOT EXISTS user_organizations (
    tenant_id       UUID        NOT NULL,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            TEXT        NOT NULL DEFAULT 'MEMBER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_organizations(tenant_id, user_id);
