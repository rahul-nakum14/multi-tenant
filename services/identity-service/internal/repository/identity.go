package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	pb "identity-service/pb"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func New(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, tenantID string, u *pb.User, passwordHash string) error {
	const q = `
		INSERT INTO users (id, tenant_id, email, first_name, last_name, password_hash, role, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	now := time.Now().UTC()
	u.CreatedAt = now.Format(time.RFC3339)
	_, err := r.db.ExecContext(ctx, q, u.Id, tenantID, u.Email, u.FirstName, u.LastName, passwordHash, u.Role, now)
	return err
}

func (r *Repository) GetUser(ctx context.Context, tenantID, userID string) (*pb.User, error) {
	const q = `
		SELECT id, tenant_id, email, first_name, last_name, role, created_at
		FROM users
		WHERE id = $1 AND tenant_id = $2
	`
	var u pb.User
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx, q, userID, tenantID).Scan(
		&u.Id, &u.TenantId, &u.Email, &u.FirstName, &u.LastName, &u.Role, &createdAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.CreatedAt = createdAt.Format(time.RFC3339)
	return &u, nil
}

func (r *Repository) CreateOrganization(ctx context.Context, tenantID string, o *pb.Organization) error {
	const q = `INSERT INTO organizations (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4)`
	now := time.Now().UTC()
	o.CreatedAt = now.Format(time.RFC3339)
	_, err := r.db.ExecContext(ctx, q, o.Id, tenantID, o.Name, now)
	return err
}

func (r *Repository) AddUserToOrganization(ctx context.Context, tenantID, userID, orgID, role string) error {
	const q = `
		INSERT INTO user_organizations (tenant_id, user_id, organization_id, role, created_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (tenant_id, user_id, organization_id) DO UPDATE SET role = $4
	`
	_, err := r.db.ExecContext(ctx, q, tenantID, userID, orgID, role, time.Now().UTC())
	return err
}

func (r *Repository) ListUserOrganizations(ctx context.Context, tenantID, userID string) ([]*pb.Organization, error) {
	const q = `
		SELECT o.id, o.tenant_id, o.name, o.created_at
		FROM organizations o
		JOIN user_organizations uo ON uo.organization_id = o.id
		WHERE uo.user_id = $1 AND uo.tenant_id = $2 AND o.tenant_id = $2
		ORDER BY o.created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, q, userID, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*pb.Organization
	for rows.Next() {
		var o pb.Organization
		var createdAt time.Time
		if err := rows.Scan(&o.Id, &o.TenantId, &o.Name, &createdAt); err != nil {
			return nil, err
		}
		o.CreatedAt = createdAt.Format(time.RFC3339)
		list = append(list, &o)
	}
	return list, rows.Err()
}
