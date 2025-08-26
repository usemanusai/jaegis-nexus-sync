package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"
)

func prompt(r *bufio.Reader, q, def string) string {
	fmt.Printf("%s [%s]: ", q, def)
	line, _ := r.ReadString('\n')
	line = strings.TrimSpace(line)
	if line == "" { return def }
	return line
}

func interactiveInstall(ctx context.Context, root string) error {
	r := bufio.NewReader(os.Stdin)
	fmt.Println("== Genesis Interactive Install ==")
	useTLS := strings.ToLower(prompt(r, "Enable TLS (y/n)", "n")) == "y"
	domain := ""; email := ""
	if useTLS {
		domain = prompt(r, "Domain (e.g., nexus.local or example.com)", "nexus.local")
		email = prompt(r, "Email for Let's Encrypt", "admin@example.com")
	}
	cfg := &Config{}
	cfg.Proxy.TLS = useTLS
	cfg.Proxy.Domain = domain
	cfg.Proxy.Email = email
	return quickInstall(ctx, root, cfg)
}

func headlessInstall(ctx context.Context, root, path string) error {
	cfg, err := loadConfig(path)
	if err != nil { return err }
	return quickInstall(ctx, root, cfg)
}

