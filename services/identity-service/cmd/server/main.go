package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"identity-service/internal/config"
	"identity-service/internal/handlers"
	"identity-service/internal/repositories"
	"identity-service/internal/services"
	pb "identity-service/pb"
	"identity-service/pkg/db"
)

func main() {
	cfg := loadConfig()
	database := connectDB(cfg.DatabaseURL)
	defer database.Close()

	repo := repositories.NewUserRepository()
	svc := services.NewIdentityService(repo)

	grpcSrv, healthSrv := setupGRPCServer(svc)

	startServers(cfg.GRPCPort, grpcSrv)
	waitForShutdown(grpcSrv, healthSrv)
}

func loadConfig() *config.Config {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Config failed", "error", err)
		os.Exit(1)
	}

	if cfg.Env == "production" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})))
	}
	slog.Info("Starting Identity Service", "env", cfg.Env)
	return cfg
}

func connectDB(url string) *sqlx.DB {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	database, err := db.New(ctx, url)
	if err != nil {
		slog.Error("Database connection failed", "error", err)
		os.Exit(1)
	}
	slog.Info("Database connected")
	return database
}

func setupGRPCServer(svc *services.IdentityService) (*grpc.Server, *health.Server) {
	grpcSrv := grpc.NewServer()
	pb.RegisterIdentityServiceServer(grpcSrv, handlers.NewIdentityHandler(svc))

	// Pure gRPC Health Check Service
	healthSrv := health.NewServer()
	healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)
	grpc_health_v1.RegisterHealthServer(grpcSrv, healthSrv)

	reflection.Register(grpcSrv)

	return grpcSrv, healthSrv
}

func startServers(grpcPort string, grpcSrv *grpc.Server) {
	grpcLis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		slog.Error("gRPC listen failed", "port", grpcPort, "error", err)
		os.Exit(1)
	}
	go func() {
		slog.Info("gRPC server listening", "port", grpcPort)
		if err := grpcSrv.Serve(grpcLis); err != nil {
			slog.Error("gRPC serve error", "error", err)
		}
	}()
}

func waitForShutdown(grpcSrv *grpc.Server, healthSrv *health.Server) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down...")

	healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_NOT_SERVING)
	grpcSrv.GracefulStop()

	slog.Info("Shutdown complete")
}
