package services

import (
	"context"

	"identity-service/internal/repositories"
	pb "identity-service/pb"
)

type IdentityService struct {
	userRepo repositories.UserRepository
}

func NewIdentityService(userRepo repositories.UserRepository) *IdentityService {
	return &IdentityService{userRepo: userRepo}
}

func (s *IdentityService) GetUser(ctx context.Context, tenantID, userID string) (*pb.User, error) {
	return s.userRepo.GetUser(ctx, tenantID, userID)
}
