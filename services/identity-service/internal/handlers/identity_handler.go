package handlers

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"identity-service/internal/services"
	pb "identity-service/pb"
)

type IdentityHandler struct {
	pb.UnimplementedIdentityServiceServer
	svc *services.IdentityService
}

func NewIdentityHandler(svc *services.IdentityService) *IdentityHandler {
	return &IdentityHandler{svc: svc}
}

func (h *IdentityHandler) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	md := extractMetadata(ctx)

	slog.Info("GetUser",
		"user_id", req.UserId,
		"tenant_id", req.TenantId,
		"authorization", md["authorization"],
		"x-tenant-id", md["x-tenant-id"],
		"x-request-id", md["x-request-id"],
	)

	user, err := h.svc.GetUser(ctx, req.TenantId, req.UserId)
	if err != nil {
		slog.Error("GetUser failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &pb.GetUserResponse{User: user}, nil
}

func (h *IdentityHandler) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented yet")
}

func (h *IdentityHandler) CreateOrganization(ctx context.Context, req *pb.CreateOrganizationRequest) (*pb.CreateOrganizationResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented yet")
}

func (h *IdentityHandler) AddUserToOrganization(ctx context.Context, req *pb.AddUserToOrganizationRequest) (*pb.AddUserToOrganizationResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented yet")
}

func (h *IdentityHandler) ListUserOrganizations(ctx context.Context, req *pb.ListUserOrganizationsRequest) (*pb.ListUserOrganizationsResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented yet")
}

// extractMetadata pulls standard headers from the incoming gRPC metadata.
// gRPC sends HTTP headers as metadata — authorization, x-tenant-id, x-request-id etc.
func extractMetadata(ctx context.Context) map[string]string {
	result := make(map[string]string)

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return result
	}

	keys := []string{"authorization", "x-tenant-id", "x-request-id"}
	for _, key := range keys {
		if vals := md.Get(key); len(vals) > 0 {
			result[key] = vals[0]
		}
	}

	return result
}
