package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type Mode int
const (
	Quick Mode = iota
	Interactive
	Headless
)

type Config struct {
	ConfigPath string
	Ports map[string]int
	DB string
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
	if err := run("docker-compose", "up", "-d"); err != nil { return err }

	fmt.Println("Waiting for services...")
	time.Sleep(4*time.Second)
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

