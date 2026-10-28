# TalentStroom — Flow Diagram Library

Production-oriented process architecture for the Dutch-first recruitment SaaS. **29 diagrams**, each in editable Mermaid, scalable SVG, 190-dpi PNG, and Markdown documentation.

## Domains

| Domain | Flow count |
|---|---:|
| `01_identity` | 6 |
| `02_recruitment` | 5 |
| `03_client_portal` | 3 |
| `04_modules_ai` | 4 |
| `05_security_privacy` | 4 |
| `06_platform` | 7 |

## Using the library

1. Start with `FLOW_INDEX.md`.
2. Edit `.mmd` source files for pull requests and architectural reviews.
3. SVG and PNG visuals are rendered previews of the modeled routes.
4. For BDD tests, translate each decision branch into Given/When/Then scenarios and add failure injection cases.
5. Update diagrams with API contracts and schema migrations as the implementation evolves.

## Design assumptions

- Cloudflare Workers with Hono TypeScript API; Neon PostgreSQL with strict org isolation.
- Per-record envelope encryption; private file storage; KMS outside Neon.
- Organization-selection login; OIDC, passkeys and MFA; inactivity lock.
- Dutch-first UI with controlled AI-assisted translations.
- Versioned custom modules are declarative (no arbitrary customer executable code).
- Tauri desktop shell is V2, not a desktop-first rewrite.

## Security caveat

Database-only theft is mitigated by externally managed encryption keys, but compromised application runtimes or KMS credentials can still expose data. No flow represents a security guarantee without implementation tests and independent review.
