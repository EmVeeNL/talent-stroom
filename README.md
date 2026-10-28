# TalentStroom

Dutch-first recruitment CRM for boutique recruitment agencies. _Werven zonder gedoe._

> Status: early development (roadmap phase 0–1). Not production-ready.

## Getting started

Requirements: Node 26 (`.nvmrc`) and Corepack.

```sh
corepack enable
pnpm install
pnpm dev     # API http://localhost:8787 · app http://localhost:5173 · site http://localhost:4321
pnpm check   # format, lint, typecheck, test
```

The API runs locally in the Workers runtime (workerd/Miniflare) via `wrangler dev`; no Cloudflare account is needed for local development.

## Documentation

- Product and architecture: [`docs/architecture/README.md`](docs/architecture/README.md)
- Architecture decisions: [`docs/adr/`](docs/adr/README.md)
- Flow diagrams: [`docs/flows/FLOW_INDEX.md`](docs/flows/FLOW_INDEX.md)
- Contributor and agent guidance: [`AGENTS.md`](AGENTS.md)
- Roadmap and backlog: [GitHub project](https://github.com/users/EmVeeNL/projects/10)

## Security

Please report vulnerabilities privately via [GitHub security advisories](https://github.com/EmVeeNL/talent-stroom/security/advisories/new), never in public issues.
