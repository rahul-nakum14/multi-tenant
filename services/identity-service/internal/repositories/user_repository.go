package repositories

import (
	"context"

	pb "identity-service/pb"
)

type UserRepository interface {
	GetUser(ctx context.Context, tenantID, userID string) (*pb.User, error)
}

type mockUserRepository struct{}

func NewUserRepository() UserRepository {
	return &mockUserRepository{}
}

func (r *mockUserRepository) GetUser(ctx context.Context, tenantID, userID string) (*pb.User, error) {
	return &pb.User{
		Id:       userID,
		TenantId: tenantID,
		Email:    "test@example.com",
		Role:     "MEMBER",
	}, nil
}
