# 10 — Identity, application security, Dutch privacy

## Authentication and account security
- Support OIDC Google, Apple and enterprise SSO where supported by selected IdP. Clarify distinction: Google/Apple social sign-in vs organization-configured SAML/OIDC enterprise federation.
- Strongly prefer **passkeys/WebAuthn** and TOTP authenticator for MFA. Offer recovery codes with secure one-time display and revocation.
- SMS and email OTP may be offered as fallback after threat review: phone takeover, SIM swap and mailbox compromise make them weaker than phishing-resistant passkeys. Enforce rate limits, anti-enumeration and device alerts.
- Organization policy can require MFA, restrict auth methods, and enforce step-up for export, key admin, billing, role escalation and large disclosure.
- Idle autolock configurable by admin (suggest 15 minutes default; 5–60 allowed); lock UI and require reauthentication / recent proof. Server sessions also expire independently (e.g., idle/absolute timeouts). Browser inactivity timers alone are not a security boundary.
- **Password expiration:** user requests expiration for password-only login. Implement policy-configurable expiry only where contractually required and coordinate with IdP; forced periodic rotation is generally not the preferred modern baseline. Require reset after compromise, provide breach-password checks and rate-limited recovery. Passkeys/SSO unaffected.
- On multiple organizations, privilege always determined by active verified membership; org switch requires rotated context. Support session/device list and remote revocation.

## OWASP-oriented secure implementation
Parameterized SQL / ORM prepared queries; no interpolated SQL from modules. Strict schema validation; output encoding; CSP, CSRF protection where relevant, SameSite/HttpOnly cookies; XSS guards, SSRF safeguards for URL previews, safe file handling, security headers, restrictive CORS, authenticated authorization on *every* endpoint, secure dependencies and supply-chain scan. Secrets via provider secret manager; no production credentials in local env files or PR logs. Deny by default.

## Dutch/EU compliance
- AVG/GDPR: documented controllers/processors, DPA, subprocessors, data-processing register, lawful basis metadata, privacy notices, rights handling, retention, breach notification procedures, DPIA screening and transfer assessments.
- Dutch AP describes 4 weeks after completed recruitment for unsuccessful candidates as usual, and up to 1 year with appropriate permission as reasonable in that specific employer application context; **do not copy blindly to agency talent pools**. Configure purpose- and context-specific retention with legal validation. Source: https://autoriteitpersoonsgegevens.nl/themas/werk-en-uitkering/sollicitaties/persoonsgegevens-van-sollicitanten
- Prevent incidental processing of BSN, ID scans, health and other special category data, with redaction/rejection/exception policy. CVs may contain incidental sensitive details.
- EU AI Act: ranking/filtering candidates can count as high-risk employment AI; isolate it from MVP assistive translation/parsing and complete dedicated legal assessment before expansion. Source: https://ai-act-service-desk.ec.europa.eu/en/employment-0
- Regional controls: EU DB region, KMS region and processing location; verify cloud vendors' subprocessors and actual data transfers. A Cloudflare deployment by itself does **not** guarantee every execution path or log stays in NL/EU.

## Policies and governance
Security owner, least privilege, access reviews, coordinated vulnerability disclosure, pentest before beta, privacy incident runbooks, breach reporting decision tree, responsible deletion, vendor review and patch SLAs. No routine operator plaintext viewing. Protect code in private GitHub repo, branch protections, least-privileged CI tokens and signed releases when feasible.
