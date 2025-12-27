# Base Go Dockerfile
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache \
    git \
    make \
    protoc \
    protobuf-dev

WORKDIR /app

# Common dependencies will be installed during implementation
