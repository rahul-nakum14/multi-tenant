package pb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type User struct {
	Id        string
	TenantId  string
	Email     string
	FirstName string
	LastName  string
	Role      string
	CreatedAt string
}

type Organization struct {
	Id        string
	TenantId  string
	Name      string
	CreatedAt string
}

type CreateUserRequest struct {
	TenantId     string
	Email        string
	FirstName    string
	LastName     string
	PasswordHash string
	Role         string
}
type CreateUserResponse struct{ User *User }

type GetUserRequest struct {
	TenantId string
	UserId   string
}
type GetUserResponse struct{ User *User }

type CreateOrganizationRequest struct {
	TenantId string
	Name     string
}
type CreateOrganizationResponse struct{ Organization *Organization }

type AddUserToOrganizationRequest struct {
	TenantId       string
	UserId         string
	OrganizationId string
	Role           string
}
type AddUserToOrganizationResponse struct{ Success bool }

type ListUserOrganizationsRequest struct {
	TenantId string
	UserId   string
}
type ListUserOrganizationsResponse struct{ Organizations []*Organization }

type IdentityServiceServer interface {
	CreateUser(context.Context, *CreateUserRequest) (*CreateUserResponse, error)
	GetUser(context.Context, *GetUserRequest) (*GetUserResponse, error)
	CreateOrganization(context.Context, *CreateOrganizationRequest) (*CreateOrganizationResponse, error)
	AddUserToOrganization(context.Context, *AddUserToOrganizationRequest) (*AddUserToOrganizationResponse, error)
	ListUserOrganizations(context.Context, *ListUserOrganizationsRequest) (*ListUserOrganizationsResponse, error)
	mustEmbedUnimplementedIdentityServiceServer()
}

type UnimplementedIdentityServiceServer struct{}

func (UnimplementedIdentityServiceServer) CreateUser(context.Context, *CreateUserRequest) (*CreateUserResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method CreateUser not implemented")
}
func (UnimplementedIdentityServiceServer) GetUser(context.Context, *GetUserRequest) (*GetUserResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetUser not implemented")
}
func (UnimplementedIdentityServiceServer) CreateOrganization(context.Context, *CreateOrganizationRequest) (*CreateOrganizationResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method CreateOrganization not implemented")
}
func (UnimplementedIdentityServiceServer) AddUserToOrganization(context.Context, *AddUserToOrganizationRequest) (*AddUserToOrganizationResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method AddUserToOrganization not implemented")
}
func (UnimplementedIdentityServiceServer) ListUserOrganizations(context.Context, *ListUserOrganizationsRequest) (*ListUserOrganizationsResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ListUserOrganizations not implemented")
}
func (UnimplementedIdentityServiceServer) mustEmbedUnimplementedIdentityServiceServer() {}

const identityServiceDesc = "identity.v1.IdentityService"

func RegisterIdentityServiceServer(s grpc.ServiceRegistrar, srv IdentityServiceServer) {
	s.RegisterService(&grpc.ServiceDesc{
		ServiceName: identityServiceDesc,
		HandlerType: (*IdentityServiceServer)(nil),
		Methods: []grpc.MethodDesc{
			{
				MethodName: "CreateUser",
				Handler:    _IdentityService_CreateUser_Handler,
			},
			{
				MethodName: "GetUser",
				Handler:    _IdentityService_GetUser_Handler,
			},
			{
				MethodName: "CreateOrganization",
				Handler:    _IdentityService_CreateOrganization_Handler,
			},
			{
				MethodName: "AddUserToOrganization",
				Handler:    _IdentityService_AddUserToOrganization_Handler,
			},
			{
				MethodName: "ListUserOrganizations",
				Handler:    _IdentityService_ListUserOrganizations_Handler,
			},
		},
		Streams: []grpc.StreamDesc{},
	}, srv)
}

func _IdentityService_CreateUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(IdentityServiceServer).CreateUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/" + identityServiceDesc + "/CreateUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(IdentityServiceServer).CreateUser(ctx, req.(*CreateUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _IdentityService_GetUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(IdentityServiceServer).GetUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/" + identityServiceDesc + "/GetUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(IdentityServiceServer).GetUser(ctx, req.(*GetUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _IdentityService_CreateOrganization_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateOrganizationRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(IdentityServiceServer).CreateOrganization(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/" + identityServiceDesc + "/CreateOrganization"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(IdentityServiceServer).CreateOrganization(ctx, req.(*CreateOrganizationRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _IdentityService_AddUserToOrganization_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(AddUserToOrganizationRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(IdentityServiceServer).AddUserToOrganization(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/" + identityServiceDesc + "/AddUserToOrganization"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(IdentityServiceServer).AddUserToOrganization(ctx, req.(*AddUserToOrganizationRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _IdentityService_ListUserOrganizations_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ListUserOrganizationsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(IdentityServiceServer).ListUserOrganizations(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/" + identityServiceDesc + "/ListUserOrganizations"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(IdentityServiceServer).ListUserOrganizations(ctx, req.(*ListUserOrganizationsRequest))
	}
	return interceptor(ctx, in, info, handler)
}
