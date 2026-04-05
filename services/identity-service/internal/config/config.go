package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	GRPCPort    string
	HTTPPort    string
	Env         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		GRPCPort:    getEnvOrDefault("GRPC_PORT", "50051"),
		HTTPPort:    getEnvOrDefault("HTTP_PORT", "8080"),
		Env:         getEnvOrDefault("ENV", "development"),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("missing required env variable: DATABASE_URL")
	}
	return nil
}

func (c *Config) IsProduction() bool {
	return c.Env == "production"
}

func getEnvOrDefault(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
