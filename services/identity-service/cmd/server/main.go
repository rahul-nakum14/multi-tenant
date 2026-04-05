package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
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
	"identity-service/internal/handler"
	"identity-service/internal/repository"
	"identity-service/internal/service"
	pb "identity-service/pb"
	"identity-service/pkg/db"
)

func main() {
	cfg := loadConfig()
	database := connectDB(cfg.DatabaseURL)
	defer database.Close()

	repo := repository.New(database)
	svc := service.New(repo)

	grpcSrv, healthSrv := setupGRPCServer(svc)
	httpSrv := setupHTTPServer(cfg.HTTPPort, database)

	startServers(cfg.GRPCPort, grpcSrv, httpSrv)
	waitForShutdown(grpcSrv, healthSrv, httpSrv)
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

func setupGRPCServer(svc *service.Service) (*grpc.Server, *health.Server) {
	grpcSrv := grpc.NewServer()
	pb.RegisterIdentityServiceServer(grpcSrv, handler.NewGRPCHandler(svc))

	healthSrv := health.NewServer()
	healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)
	grpc_health_v1.RegisterHealthServer(grpcSrv, healthSrv)
	reflection.Register(grpcSrv)

	return grpcSrv, healthSrv
}

func setupHTTPServer(port string, database *sqlx.DB) *http.Server {
	return &http.Server{
		Addr:    ":" + port,
		Handler: handler.NewHTTPRouter(database),
	}
}

func startServers(grpcPort string, grpcSrv *grpc.Server, httpSrv *http.Server) {
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

	go func() {
		slog.Info("HTTP server listening", "port", httpSrv.Addr)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("HTTP serve error", "error", err)
		}
	}()
}

func waitForShutdown(grpcSrv *grpc.Server, healthSrv *health.Server, httpSrv *http.Server) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down...")

	healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_NOT_SERVING)

	grpcSrv.GracefulStop()

	shutCtx, shutCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutCancel()
	_ = httpSrv.Shutdown(shutCtx)

	slog.Info("Shutdown complete")
}
