# Contributing to JAEGIS NexusSync

Thanks for your interest! We welcome contributions.

## Ways to Contribute
- Bug reports and feature requests via GitHub Issues
- Pull requests with fixes and improvements
- Docs: README, installer docs, API examples, and diagrams

## Development Setup
- Prereqs: Docker + Docker Compose
- Optional: Node 22 if running services locally without containers
- Run the full stack via the Genesis Installer:
  - `genesis-installer --quick`

## Pull Request Guidelines
- Create a feature branch: `feat/...` or `fix/...`
- Add tests where appropriate; update docs
- Ensure `docker compose` stack starts cleanly; include any migration changes
- Keep PRs focused and well-described

## Code Style
- TypeScript: follow existing NestJS/Fastify patterns
- Python: black/ruff preferred in research-backend
- Go: fmt/vet; keep standard-library first approach

## License
By contributing, you agree your contributions are licensed under the MIT License.

