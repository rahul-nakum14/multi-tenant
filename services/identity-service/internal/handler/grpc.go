package handler

import (
	"context"
	"log/slog"

	"identity-service/internal/service"
	pb "identity-service/pb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCHandler struct {
	pb.UnimplementedIdentityServiceServer
	svc *service.Service
}

func NewGRPCHandler(svc *service.Service) *GRPCHandler {
	return &GRPCHandler{svc: svc}
}

func (h *GRPCHandler) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	slog.Info("CreateUser", "tenant_id", req.TenantId, "email", req.Email)
	user, err := h.svc.CreateUser(ctx, req)
	if err != nil {
		slog.Error("CreateUser failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	return &pb.CreateUserResponse{User: user}, nil
}

func (h *GRPCHandler) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	slog.Info("GetUser", "tenant_id", req.TenantId, "user_id", req.UserId)
	user, err := h.svc.GetUser(ctx, req)
	if err != nil {
		if err.Error() == "user not found" {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		slog.Error("GetUser failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	return &pb.GetUserResponse{User: user}, nil
}

func (h *GRPCHandler) CreateOrganization(ctx context.Context, req *pb.CreateOrganizationRequest) (*pb.CreateOrganizationResponse, error) {
	slog.Info("CreateOrganization", "tenant_id", req.TenantId, "name", req.Name)
	org, err := h.svc.CreateOrganization(ctx, req)
	if err != nil {
		slog.Error("CreateOrganization failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	return &pb.CreateOrganizationResponse{Organization: org}, nil
}

func (h *GRPCHandler) AddUserToOrganization(ctx context.Context, req *pb.AddUserToOrganizationRequest) (*pb.AddUserToOrganizationResponse, error) {
	slog.Info("AddUserToOrganization", "tenant_id", req.TenantId, "user_id", req.UserId, "org_id", req.OrganizationId)
	if err := h.svc.AddUserToOrganization(ctx, req); err != nil {
		slog.Error("AddUserToOrganization failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	return &pb.AddUserToOrganizationResponse{Success: true}, nil
}

func (h *GRPCHandler) ListUserOrganizations(ctx context.Context, req *pb.ListUserOrganizationsRequest) (*pb.ListUserOrganizationsResponse, error) {
	slog.Info("ListUserOrganizations", "tenant_id", req.TenantId, "user_id", req.UserId)
	orgs, err := h.svc.ListUserOrganizations(ctx, req)
	if err != nil {
		slog.Error("ListUserOrganizations failed", "error", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	return &pb.ListUserOrganizationsResponse{Organizations: orgs}, nil
}
