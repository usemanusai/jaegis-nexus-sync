package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)


// NOTE: for brevity, we inline minimal YAML parsing with a tiny decoder (no third-party deps).

type Mode int
const (
	Quick Mode = iota
	Interactive
	Headless
)

type Config struct {
	ConfigPath string
	Ports struct {
		RAG int `yaml:"rag"`
		Research int `yaml:"research"`
		GithubSync int `yaml:"github_sync"`
		Web int `yaml:"web"`
		Maintenance int `yaml:"maintenance"`
	} `yaml:"ports"`
	Secrets struct {
		GHSYNCJWT string `yaml:"gh_sync_jwt"`
		RAGApiKey string `yaml:"api_key_rag"`
	} `yaml:"secrets"`
	Database struct {
		Type string `yaml:"type"`
		Host string `yaml:"host"`
		Port int `yaml:"port"`
		User string `yaml:"user"`
		Pass string `yaml:"pass"`
		Name string `yaml:"name"`
	} `yaml:"database"`
	Proxy struct {
		Enabled bool `yaml:"enabled"`
		TLS bool `yaml:"tls"`
			Domain string `yaml:"domain"`
			Email string `yaml:"email"`
		} `yaml:"proxy"`
	}

func loadConfig(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil { return nil, err }
	// Very naive YAML parsing for the sample config; for production, use a YAML lib.
	cfg := &Config{}
	lines := strings.Split(string(b), "\n")
	section := ""
	for _, ln := range lines {
		l := strings.TrimSpace(ln)
		if l == "" || strings.HasPrefix(l, "#") { continue }
		if strings.HasSuffix(l, ":") {
			section = strings.TrimSuffix(l, ":")
			continue
		}
		kv := strings.SplitN(l, ":", 2)
		if len(kv) != 2 { continue }
		key := strings.TrimSpace(kv[0])
		val := strings.TrimSpace(kv[1])
		val = strings.Trim(val, "\"")
		switch section {
		case "ports":
			if key=="rag" { fmt.Sscanf(val, "%d", &cfg.Ports.RAG) }
			if key=="research" { fmt.Sscanf(val, "%d", &cfg.Ports.Research) }
			if key=="github_sync" { fmt.Sscanf(val, "%d", &cfg.Ports.GithubSync) }
			if key=="web" { fmt.Sscanf(val, "%d", &cfg.Ports.Web) }
			if key=="maintenance" { fmt.Sscanf(val, "%d", &cfg.Ports.Maintenance) }
		case "database":
			if key=="type" { cfg.Database.Type = val }
			if key=="host" { cfg.Database.Host = val }
			if key=="port" { fmt.Sscanf(val, "%d", &cfg.Database.Port) }
			if key=="user" { cfg.Database.User = val }
			if key=="pass" { cfg.Database.Pass = val }
			if key=="name" { cfg.Database.Name = val }
		case "secrets":
			if key=="gh_sync_jwt" { cfg.Secrets.GHSYNCJWT = val }
			if key=="api_key_rag" { cfg.Secrets.RAGApiKey = val }
		case "proxy":
			if key=="enabled" { cfg.Proxy.Enabled = (val=="true") }
			if key=="tls" { cfg.Proxy.TLS = (val=="true") }
		}
	}
	return cfg, nil
}

	} `yaml:"proxy"`
}
type ComposeOpts struct {
	TLS bool
	Domain string
	Email string
}

func writeComposeOverride(root string, opts ComposeOpts, force bool) error {
	p := filepath.Join(root, "docker-compose.override.yml")
	if !force {
		if _, err := os.Stat(p); err == nil { return nil }
	}
	tlsCmd := ""
	tlsPorts := "      - \"80:80\"\n"
	vol := "      - /var/run/docker.sock:/var/run/docker.sock:ro\n"
	if opts.TLS {
		tlsCmd = strings.Join([]string{
			"      - --entrypoints.web.address=:80",
			"      - --entrypoints.websecure.address=:443",
			"      - --certificatesresolvers.le.acme.email=" + opts.Email,
			"      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json",
			"      - --certificatesresolvers.le.acme.httpchallenge=true",
			"      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web",
		}, "\n") + "\n"
		tlsPorts = "      - \"80:80\"\n      - \"443:443\"\n"
		vol += "      - ./traefik:/letsencrypt\n"
		_ = os.MkdirAll(filepath.Join(root, "traefik"), 0755)
		_ = os.WriteFile(filepath.Join(root, "traefik", "acme.json"), []byte("{}"), 0600)
	}
	content := `version: "3.9"
services:
  rag:
    build:
      context: .
      dockerfile: Dockerfile.rag
    container_name: nexus-rag
    environment:
      PORT: 33001
    ports:
      - "33001:33001"
    depends_on:
      - db
      - redis
  github-sync:
    build:
      context: .
      dockerfile: Dockerfile.github-sync
    container_name: nexus-github-sync
    env_file:
      - .env.github-sync
    ports:
      - "33031:33031"
    depends_on:
      - db
  research:
    build:
      context: .
      dockerfile: Dockerfile.research
    container_name: nexus-research
    env_file:
      - .env.research
    ports:
      - "33011:33011"
    depends_on:
      - redis
  web-ui:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: nexus-web
    environment:
      WEB_PORT: 33021
    ports:
      - "33021:33021"
    depends_on:
      - rag
      - github-sync
      - maintenance
  proxy:
    image: traefik:v3.1
    container_name: nexus-proxy
    command:
      - --api.insecure=true
      - --providers.docker=true
` + tlsCmd + `    ports:
      - "8080:8080"
` + tlsPorts + `    depends_on:
      - rag
      - github-sync
      - research
      - web-ui
      - maintenance
    volumes:
` + vol + `
`
	return os.WriteFile(p, []byte(content), 0644)
}


func genSecret(n int) string { b := make([]byte, n); rand.Read(b); return hex.EncodeToString(b) }

func run(cmd string, args ...string) error {
	c := exec.Command(cmd, args...)
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	return c.Run()
}

func has(cmd string) bool {
	_, err := exec.LookPath(cmd)
	return err == nil
}

func ensureDeps() error {
	missing := []string{}
	for _, c := range []string{"docker", "docker-compose"} {
		if !has(c) { missing = append(missing, c) }
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing dependencies: %s", strings.Join(missing, ", "))
func waitHTTP(url string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		resp, err := http.Get(url)
		if err == nil && resp.StatusCode < 500 {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("timeout waiting for %s", url)
}

func waitTCP(hostport string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", hostport, 2*time.Second)
		if err == nil {
			_ = conn.Close()
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("timeout waiting for %s", hostport)
}

	}
	return nil
}

func writeEnv(dir, name string, lines []string) error {
	p := filepath.Join(dir, name)
	f, err := os.Create(p); if err != nil { return err }
	defer f.Close()
	w := bufio.NewWriter(f)
	for _, l := range lines { fmt.Fprintln(w, l) }
	return w.Flush()
}

func quickInstall(ctx context.Context, root string) error {
	fmt.Println("== Genesis Quick Install ==")
	if err := ensureDeps(); err != nil { return err }
	// Secrets
	ghSecret := genSecret(16)
	jwtSecret := genSecret(16)
	ragApiKey := genSecret(16)

	// Write .env files (minimal example; extend as needed)
	if err := writeEnv(root, ".env.github-sync", []string{
		fmt.Sprintf("GH_SYNC_PORT=%d", 33031),
		fmt.Sprintf("GH_SYNC_JWT_SECRET=%s", jwtSecret),
	}); err != nil { return err }
	if err := writeEnv(root, ".env.maintenance", []string{
		fmt.Sprintf("MAINTENANCE_PORT=%d", 33041),
		fmt.Sprintf("GH_SYNC_URL=%s", "http://localhost:33031"),
		fmt.Sprintf("GH_SYNC_JWT_SECRET=%s", jwtSecret),
		fmt.Sprintf("REDIS_URL=%s", "redis://localhost:56379"),
	}); err != nil { return err }
	if err := writeEnv(root, ".env.rag", []string{
		fmt.Sprintf("PORT=%d", 33001),
		fmt.Sprintf("RAG_API_KEY=%s", ragApiKey),
	}); err != nil { return err }
	if err := writeEnv(root, ".env.research", []string{
		fmt.Sprintf("RAG_INGEST_URL=%s", "http://localhost:33001/api/v1/ingest"),
		fmt.Sprintf("REDIS_URL=%s", "redis://localhost:56379"),
	}); err != nil { return err }

	// Build and compose up full stack
	if err := writeComposeOverride(root); err != nil { return err }
	if err := run("npm", "install"); err != nil { return err }
	if err := run("docker-compose", "-f", "docker-compose.yml", "-f", "docker-compose.override.yml", "up", "-d", "--build"); err != nil { return err }

	fmt.Println("Waiting for services...")
	_ = waitTCP("localhost:55432", 120*time.Second) // Postgres
	_ = waitTCP("localhost:56379", 120*time.Second) // Redis
	// Prisma migrations (deploy) after DB up
	_ = run("npm", "run", "-w", "packages/db-schema", "prisma:generate")
	_ = run("npm", "run", "-w", "packages/db-schema", "prisma:deploy")
	// Health checks (can be extended to RAG/GH/Research)
	_ = waitHTTP("http://localhost:33041/api/v1/health", 120*time.Second) // Maintenance
	// Extended health checks
	_ = waitHTTP("http://localhost:33001/api/v1/health", 120*time.Second) // RAG
	_ = waitHTTP("http://localhost:33011/api/v1/health", 120*time.Second) // Research
	_ = waitHTTP("http://localhost:33031/health", 120*time.Second) // GitHub Sync
	_ = waitHTTP("http://localhost:33021", 120*time.Second) // Web UI

	// Post-install report
	report := []string{
		"NexusSync Installation Report:",
		"",
		"Endpoints:",
		"- RAG:        http://localhost:33001/api/v1/health",
		"- Research:   http://localhost:33011/api/v1/health",
		"- GitHubSync: http://localhost:33031/health",
		"- Maintenance:http://localhost:33041/api/v1/health",
		"- Web UI:     http://localhost:33021",
		"- Proxy UI:   http://localhost:8080",
		"",
		"Credentials/Keys:",
		fmt.Sprintf("- GH_SYNC_JWT_SECRET: %s", jwtSecret),
		fmt.Sprintf("- RAG_API_KEY: %s", ragApiKey),
	}
	_ = os.MkdirAll(filepath.Join(root, "install-report"), 0755)
	_ = os.WriteFile(filepath.Join(root, "install-report", "report.txt"), []byte(strings.Join(report, "\n")), 0644)
	fmt.Println("Installation report saved at install-report/report.txt")

	fmt.Println("Done. Access:")
	fmt.Println("- RAG:        http://localhost:33001/api/v1/health")
	fmt.Println("- Research:   http://localhost:33011/api/v1/health")
	fmt.Println("- GitHubSync: http://localhost:33031/health")
	fmt.Println("- Maintenance:http://localhost:33041/api/v1/health")
	return nil
}

func main(){
	quick := flag.Bool("quick", false, "Quick install")
	interactive := flag.Bool("interactive", false, "Interactive setup")
	cfgPath := flag.String("config", "", "Headless config path")
	update := flag.Bool("update", false, "Update existing deployment")
	rollback := flag.Bool("rollback", false, "Rollback to previous version")
	uninstall := flag.Bool("uninstall", false, "Uninstall deployment")
	flag.Parse()

	mode := Quick
	if *interactive { mode = Interactive } else if *cfgPath != "" { mode = Headless }
	var cfg *Config
	if mode == Headless {
		c, err := loadConfig(*cfgPath); if err != nil { fmt.Println("Config error:", err); os.Exit(1) }
		cfg = c
	}

	root, _ := os.Getwd()
	switch {
	case *update:
		fmt.Println("Update not yet implemented")
		os.Exit(1)
	case *rollback:
		fmt.Println("Rollback not yet implemented")
		os.Exit(1)
	case *uninstall:
		fmt.Println("Uninstall not yet implemented")
		os.Exit(1)
	}

	ctx := context.Background()
	switch mode {
	case Quick:
		if err := quickInstall(ctx, root); err != nil { fmt.Println("Error:", err); os.Exit(1) }
	case Interactive:
		fmt.Println("Interactive mode not yet implemented"); os.Exit(1)
	case Headless:
		fmt.Println("Headless mode not yet implemented"); os.Exit(1)
	}

	_ = runtime.NumCPU()
}

