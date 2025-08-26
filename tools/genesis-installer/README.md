# Genesis Installer

To avoid requiring Go on the user's machine, we provide prebuilt binaries and a Docker-based runner.

## Option A: Prebuilt Single Binary
Download the prebuilt "genesis-installer" for your OS from Releases and run:

- Windows: `genesis-installer.exe --quick`
- macOS: `./genesis-installer --quick`
- Linux: `./genesis-installer --quick`

No Go toolchain is required for this method.

## Option B: Docker-based Installer (no Go, no Node required)
If you have Docker installed, you can run the installer in a container:

```
docker build -f tools/genesis-installer/Dockerfile -t genesis-installer .
docker run --rm -it -v "$PWD":/work -w /work --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  genesis-installer --quick
```

This mounts your repo into the container and runs the installer inside Alpine.

Notes:
- We bind the Docker socket so the installer can run docker-compose on your host.
- Using `--network host` simplifies access to localhost ports on Linux. On macOS/Windows, Docker Desktop handles networking.

## Roadmap
- Provide prebuilt binaries (.exe, .dmg/.pkg, .AppImage) in CI releases
- Add interactive and headless modes with config.yaml
- Extend to generate docker-compose.override.yml to orchestrate all services and reverse proxy

