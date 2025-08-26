# Build stage
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY . .
WORKDIR /src/tools/genesis-installer
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -o /out/genesis-installer

# Runtime stage
FROM alpine:3.20
WORKDIR /work
COPY --from=build /out/genesis-installer /usr/local/bin/genesis-installer
ENTRYPOINT ["genesis-installer"]

