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
	}); err != nil { return err }
	if err := writeEnv(root, ".env.research", []string{
		fmt.Sprintf("RAG_INGEST_URL=%s", "http://localhost:33001/api/v1/ingest"),
		fmt.Sprintf("REDIS_URL=%s", "redis://localhost:56379"),
	}); err != nil { return err }

	// Build and compose up
	if err := run("npm", "install"); err != nil { return err }
	// Build services as needed; compose will build maintenance
	if err := run("docker-compose", "-f", "docker-compose.yml", "-f", "docker-compose.override.yml", "up", "-d"); err != nil { return err }

	fmt.Println("Waiting for services...")
	_ = waitTCP("localhost:55432", 60*time.Second) // Postgres
	_ = waitTCP("localhost:56379", 60*time.Second) // Redis
	_ = waitHTTP("http://localhost:33041/api/v1/health", 90*time.Second) // Maintenance
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

