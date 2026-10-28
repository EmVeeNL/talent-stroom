# 17 — Version 2: Rust desktop shell

## Goal
Optional native-feeling client for Windows, macOS and Linux with secure session management, notifications, file-drop CV upload and launch shortcuts, while retaining one server-side API and authoritative cloud data.

## Recommended option
Evaluate **Tauri 2** (Rust backend + OS WebView + Vite React UI) before a bespoke Rust UI. Share TypeScript UI, OpenAPI SDK and i18n packages with the browser app; native bridge supplies narrowly scoped file-picker, notifications and local secure credential storage. Investigate alternatives if deep native UX or security controls justify greater cost.

## Security
- Never ship database credentials or master/DEK encryption keys to the shell.
- Prefer system WebAuthn/passkeys, OS keychain for session tokens; no persistent plaintext CV caches by default.
- Strict Tauri capability permissions and IPC allowlists; restrict protocol and filesystem access; signed binaries, update signatures, security patching and reproducible supply-chain controls.
- Auto-lock obeys organization policy; log out/switch org wipes local caches and drops outstanding requests.
- Linux/Windows/macOS credential store and packaging evaluated separately; device loss response and remote session revocation.

## Deployment
macOS notarization/signing, Windows signing and update channel, Linux packages (AppImage/deb/rpm as appropriate). Beta updates through signed channel; versioned compatibility with `/v1` API. Telemetry opt-in and privacy reviewed.

## Offline strategy
**v2 starts online-only.** Offline mode requires new security design: encryption keys on endpoints, conflict resolution, revocation delay, GDPR deletion propagation, local DB migrations, user controls and device management. Treat offline as a separate future program.

## Go/no-go criteria
Prove desktop gives meaningful time saving vs PWA and the team can support three OS release pipelines and timely security patches. Avoid native app just for aesthetic preference.
