package service

import (
	"context"
	"fmt"

	"identity-service/internal/repository"
	pb "identity-service/pb"

	"github.com/google/uuid"
)

type Service struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.User, error) {
	if req.TenantId == "" || req.Email == "" {
		return nil, fmt.Errorf("tenant_id and email are required")
	}
	if req.PasswordHash == "" {
		return nil, fmt.Errorf("password_hash is required")
	}

	role := req.Role
	if role == "" {
		role = "MEMBER"
	}

	user := &pb.User{
		Id:        uuid.New().String(),
		TenantId:  req.TenantId,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      role,
	}

	if err := s.repo.CreateUser(ctx, req.TenantId, user, req.PasswordHash); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return user, nil
}

func (s *Service) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	if req.TenantId == "" || req.UserId == "" {
		return nil, fmt.Errorf("tenant_id and user_id are required")
	}
	user, err := s.repo.GetUser(ctx, req.TenantId, req.UserId)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

func (s *Service) CreateOrganization(ctx context.Context, req *pb.CreateOrganizationRequest) (*pb.Organization, error) {
	if req.TenantId == "" || req.Name == "" {
		return nil, fmt.Errorf("tenant_id and name are required")
	}
	org := &pb.Organization{
		Id:       uuid.New().String(),
		TenantId: req.TenantId,
		Name:     req.Name,
	}
	if err := s.repo.CreateOrganization(ctx, req.TenantId, org); err != nil {
		return nil, fmt.Errorf("create org: %w", err)
	}
	return org, nil
}

func (s *Service) AddUserToOrganization(ctx context.Context, req *pb.AddUserToOrganizationRequest) error {
	if req.TenantId == "" || req.UserId == "" || req.OrganizationId == "" {
		return fmt.Errorf("tenant_id, user_id, and organization_id are required")
	}
	role := req.Role
	if role == "" {
		role = "MEMBER"
	}
	return s.repo.AddUserToOrganization(ctx, req.TenantId, req.UserId, req.OrganizationId, role)
}

func (s *Service) ListUserOrganizations(ctx context.Context, req *pb.ListUserOrganizationsRequest) ([]*pb.Organization, error) {
	if req.TenantId == "" || req.UserId == "" {
		return nil, fmt.Errorf("tenant_id and user_id are required")
	}
	return s.repo.ListUserOrganizations(ctx, req.TenantId, req.UserId)
}
