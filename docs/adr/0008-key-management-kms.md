# 0008 — Key management: external KMS for envelope encryption

- **Status:** Proposed
- **Date:** 2026-10-29
- **Resolves:** informs D05 (encryption scope), D12 (operator decrypt access), D14 (Worker PG driver and KMS); D02 (EU geography) for the KMS part
- **Issue:** #73 (spike); measurements follow in #42; implementation in #74

> This is a desk study. All vendor facts come from vendor documentation read on 2026-10-29 and are linked inline. Latency figures are **estimates**; they must be measured in PoC #42 before this ADR is accepted. No cloud resources were created.

## Context

Candidate PII is envelope-encrypted per record (`docs/architecture/security/01-encryption-key-management.md`, flow 19). Each record gets a random 256-bit DEK (AES-256-GCM). The DEK is wrapped by a KEK that lives **outside the database**, in a managed KMS/HSM with a separate trust boundary and audited access. The database (`encryption_key_envelopes`, `docs/database/sql/03_data_protection.sql`) stores the wrapped DEK, `kms_key_ref` and `wrapping_version`, never the KEK or a plaintext DEK. Blind indexes (flow 20) need a keyed HMAC whose key is also held outside Neon.

Constraints:

- **Runtime:** Hono API on Cloudflare Workers. No Node-only SDKs. We authenticate and call the KMS over plain `fetch` + WebCrypto. Workers WebCrypto supports RSASSA-PKCS1-v1_5, RSA-PSS, HMAC, HKDF, AES-GCM and AES-KW ([Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)).
- **Accounts:** the product owner has only a Cloudflare account. No AWS, GCP or Azure account exists yet. Whichever we pick, the owner must create the account.
- **Residency:** EU is required. Netherlands-only processing is a bonus; whether customers need it is still open (stakeholder question 1 in `docs/architecture/decisions/01-open-decisions.md`).
- **Scale:** alpha with 2–3 agencies. We budget for roughly 100k–1M unwrap operations per month. Cost should stay proportionate.
- **Threat model** (spec 01): a database-only exfiltration must not reveal PII. A compromised Worker can call the legitimate decrypt path. The KMS cannot prevent that, but it can **log, rate-limit, alert on and revoke** that access. That property is why we reject a "key in a Worker secret" design for KEKs.

Workers facts that shape the design:

- Only 6 connections per invocation can wait for response headers at the same time ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). Unwrapping N records for a list view is therefore throttled to 6 in flight.
- Workers can be pinned near a cloud region with a placement region hint such as `gcp:…`, `aws:…` or `azure:westeurope`. Placement applies to fetch handlers only ([Placement](https://developers.cloudflare.com/workers/configuration/placement/)).
- Restricting where Cloudflare processes traffic (Data Localization Suite) is an Enterprise-only add-on ([DLS](https://developers.cloudflare.com/data-localization/)). As spec 02 already notes, the Worker itself is therefore not guaranteed to run in NL or the EU. KMS residency covers key material and KMS operations only.

## Options considered

### 1. Google Cloud KMS (europe-west4, Netherlands), HSM protection level — **recommended**

- **Residency:** `europe-west4` (Netherlands) is a Cloud KMS region with Cloud HSM and Cloud EKM available. The `europe` multi-region offers HSM in multi-tenant form only ([locations](https://docs.cloud.google.com/kms/docs/locations)).
  - **Caveat 1:** Cloud KMS _regional endpoints_ (`cloudkms.<region>.rep.googleapis.com`, where TLS is terminated in-region) are listed for europe-west3/-west6/-west9 but **not europe-west4** ([regional endpoints list](https://docs.cloud.google.com/docs/security/compliance/regional-service-endpoints), [about regional endpoints](https://docs.cloud.google.com/docs/security/compliance/about-regional-endpoints)). With europe-west4 we call the global endpoint. The key and the crypto operation stay in NL, but TLS terminates at Google's front end. Google does list an STS regional endpoint for europe-west4.
  - **Caveat 2:** Log buckets are `global` by default. Set an org-level default storage location _before_ creating projects, because existing bucket locations cannot be changed ([regionalized logs](https://docs.cloud.google.com/logging/docs/regionalized-logs)).
- **Protection:** multi-tenant Cloud HSM keys are FIPS 140-2 Level 3. Software keys use the FIPS 140-3 validated BoringCrypto module ([protection levels](https://docs.cloud.google.com/kms/docs/protection-levels)).
- **API fit:**
  - `:encrypt` / `:decrypt` on a symmetric key accept `additionalAuthenticatedData` (≤ 64 KiB). Decrypt fails unless the AAD matches. AAD is **not** written to Cloud Audit Logs ([AAD](https://docs.cloud.google.com/kms/docs/additional-authenticated-data)).
  - Decrypt picks the right key version automatically after rotation. Old versions must stay enabled until data is re-encrypted ([re-encrypt](https://docs.cloud.google.com/kms/docs/re-encrypt-data)).
  - Automatic rotation is supported for symmetric keys; Google gives a 90-day schedule as an example ([rotation](https://docs.cloud.google.com/kms/docs/key-rotation)).
  - Request/response CRC32C integrity fields are available ([encrypt/decrypt](https://docs.cloud.google.com/kms/docs/encrypt-decrypt)).
  - MAC keys support `MacSign`/`MacVerify`, with a 16 KiB input limit on HSM keys ([MAC](https://docs.cloud.google.com/kms/docs/create-validate-mac-signatures)).
  - Destroyed versions sit in "scheduled for destruction" for 30 days by default and can be restored during that time. The duration is configurable per key and can have an org-policy minimum ([destroy/restore](https://docs.cloud.google.com/kms/docs/destroy-restore)).
- **Least privilege:** separate predefined roles exist for encrypt-only (`cryptoKeyEncrypter`), decrypt-only (`cryptoKeyDecrypter`) and MAC (`signer`/`verifier`). They can be granted on a single CryptoKey, but not on a single version ([roles](https://docs.cloud.google.com/kms/docs/reference/permissions-and-roles), [MAC roles](https://docs.cloud.google.com/kms/docs/create-validate-mac-signatures)). IAM cannot condition on AAD, so per-organization _access_ separation requires per-organization keys.
- **Auth from Workers:**
  - Default path: a service-account key signs a JWT (RS256 via WebCrypto). The JWT is exchanged for an OAuth access token (`exp` at most 1 h after `iat`). Alternatively, the self-signed JWT can be sent directly as a bearer token with `aud=https://cloudkms.googleapis.com/` for APIs that publish a service definition ([service accounts](https://developers.google.com/identity/protocols/oauth2/service-account)).
  - **SA key creation is blocked by default** in organizations created on or after 2024-05-03 (`iam.disableServiceAccountKeyCreation`). Keys never expire unless `iam.serviceAccountKeyExpiryHours` is set (maximum 90 days) ([org policy](https://docs.cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts)). We would need a scoped project-level exception.
  - Alternative: **Workload Identity Federation** with an OIDC provider whose JWKS we _upload_ (max 8 keys, RS256/ES256, token lifetime ≤ 24 h) ([WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation), [other providers](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers)). Cloudflare does not issue OIDC tokens to Workers (no such feature found in Cloudflare docs). The Worker would sign its own assertion with an ES256 private key stored as a Worker secret. That is still a long-lived secret. The gains are that no Google-issued SA key exists, rotation means uploading a JWKS, and attribute conditions apply. It is not true keyless federation.
- **Audit:** Encrypt, Decrypt and MacSign are `DATA_READ` Data Access audit events ([KMS audit logging](https://docs.cloud.google.com/kms/docs/audit-logging)). Data Access logs are **disabled by default** and must be enabled ([configure](https://docs.cloud.google.com/logging/docs/audit/configure-data-access)). Logging costs $0.50/GiB after the first 50 GiB per project per month ([pricing](https://cloud.google.com/stackdriver/pricing)). Alerting uses log-based metrics plus alert policies.
- **Cost** ([KMS pricing](https://cloud.google.com/kms/pricing), effective 2025-03-17):
  - Symmetric key version, SOFTWARE: $0.000082192/h ≈ $0.06/month.
  - Symmetric key version, HSM: $0.001369863/h ≈ $1.00/month.
  - Crypto operations: $0.03 per 10k for both software and HSM.
  - Rotation is free, but every active older version keeps billing until it is destroyed.
- **Quotas** ([quotas](https://docs.cloud.google.com/kms/quotas)):
  - Legacy: 60k software crypto requests/min per calling project, and 500 QPS HSM symmetric per region.
  - After 2026-02-16 the quotas are token-based per region (HSM usage 3,000,000 tokens/min). Verify the per-operation token cost in the console.
- **Pros:** only hyperscaler KMS with an HSM in the Netherlands at per-key pricing. Cheap. Clean REST API. Per-key IAM split between encrypt and decrypt. Native MAC. Just-in-time access via Privileged Access Manager ([PAM](https://docs.cloud.google.com/iam/docs/pam-overview)).
- **Cons:**
  - Long-lived credential in a Worker secret, needing an org-policy exception.
  - Audit logs are off by default and do not show AAD.
  - No in-region TLS endpoint for europe-west4.
  - IAM cannot scope by organization context.

### 2. AWS KMS (EU region, e.g. eu-central-1 Frankfurt) — **runner-up**

- **Residency:** AWS has **no Netherlands region**. EU options include Frankfurt, Ireland, Paris, Stockholm, Milan and Spain. The AWS European Sovereign Cloud reached GA on 2026-01-15 in Brandenburg (`eusc-de-east-1`), with sovereign Local Zones _planned_ for the Netherlands ([AWS press release](https://press.aboutamazon.com/aws/2026/1/aws-launches-aws-european-sovereign-cloud-and-announces-expansion-across-europe)). Endpoints are regional (`kms.<region>.amazonaws.com`).
- **API fit:**
  - Symmetric `Encrypt`/`Decrypt`/`GenerateDataKey` accept an **encryption context**, which acts as AAD. The context is logged in CloudTrail in plaintext and can be **enforced in key policies** (`kms:EncryptionContext:*`) and grant constraints ([encryption context](https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html)). One KEK can therefore have org-scoped _policy_ conditions. The context must not contain sensitive data; org/record UUIDs are fine.
  - Automatic rotation (default 365 days, custom period possible) and on-demand rotation are supported. Decrypt picks the right material automatically ([rotation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html)).
  - HMAC keys exist (`GenerateMac`, ≤ 4096 bytes) but support **no automatic rotation** and no encryption context ([HMAC](https://docs.aws.amazon.com/kms/latest/developerguide/hmac.html)).
- **Auth from Workers:**
  - SigV4 via `aws4fetch` (MIT, 2.5 kB gzipped, explicitly supports Workers) ([aws4fetch](https://github.com/mhart/aws4fetch)). This needs an IAM access key stored as a Worker secret.
  - IAM Roles Anywhere issues temporary credentials against an X.509 certificate from our CA ([Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html)). The certificate's private key would still be a Worker secret, and we would have to run a CA. That is extra complexity for a marginal gain.
- **Audit:** CloudTrail logs all KMS operations, including Decrypt, by default ([KMS + CloudTrail](https://docs.aws.amazon.com/kms/latest/developerguide/logging-using-cloudtrail.html)). Event history covers 90 days free, and the first trail copy of management events to S3 is free ([CloudTrail pricing](https://aws.amazon.com/cloudtrail/pricing/)). This is the best audit story of the options.
- **Cost** ([KMS pricing](https://aws.amazon.com/kms/pricing/)):
  - $1/key/month. The first and second rotations each add $1/month; later rotations are free.
  - $0.03 per 10k requests (implied symmetric rate). Free tier of 20k requests/month.
  - All KMS keys are HSM-backed (FIPS 140-3, per the HMAC page above).
- **Quotas:** shared symmetric crypto quota of 20,000 rps in eu-central-1 and 100,000 rps in eu-west-1 ([quotas](https://docs.aws.amazon.com/kms/latest/developerguide/requests-per-second.html)).
- **Pros:** strongest audit defaults, policy enforcement on context, and HSM included at the base price.
- **Cons:** no NL region (Frankfurt adds roughly 7–10 ms RTT from AMS, estimated). IAM access key in a Worker secret. Slightly more expensive per key with rotation.

### 3. Azure Key Vault (Premium) / Managed HSM, West Europe (Netherlands)

- **Residency and replication:**
  - Region: West Europe is in the Netherlands ([Azure regions](https://learn.microsoft.com/en-us/azure/reliability/regions-list)).
  - Key Vault replicates vault contents **asynchronously to the paired region**, and Microsoft may fail over to it ([Key Vault reliability](https://learn.microsoft.com/en-us/azure/reliability/reliability-key-vault)). For West Europe the pair is North Europe (Ireland). That is EU, but **not NL-only**.
  - Managed HSM "doesn't store/process customer data outside the region" ([Managed HSM](https://learn.microsoft.com/en-us/azure/key-vault/managed-hsm/overview)).
- **API fit:**
  - Symmetric `oct-HSM` keys (AES-KW/AES-GCM, wrapKey/unwrapKey) in Key Vault Premium are **public preview, without SLA** ([about keys](https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys)). GA alternatives are RSA-HSM `wrapKey`/`unwrapKey` (RSA-OAEP-256) or Managed HSM.
  - RSA wrap has no AAD. AAD binding would happen only in our own AES-GCM layer.
- **Auth from Workers:** Entra client-credentials flow with a certificate-signed client assertion (PS256) ([certificate credentials](https://learn.microsoft.com/en-us/entra/identity-platform/certificate-credentials)). Entra workload identity federation needs an external OIDC issuer ([WIF](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)); Workers do not have one.
- **Least privilege:** the role "Key Vault Crypto Service Encryption User" allows wrap/unwrap only. Per-key assignments are possible but Microsoft discourages them ([RBAC guide](https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide)).
- **Audit:** AuditEvent logs require a diagnostic setting; they are not on by default ([logging](https://learn.microsoft.com/en-us/azure/key-vault/general/logging)).
- **Cost** (Azure retail prices API, westeurope, 2026-10-29: `prices.azure.com/api/retail/prices`, see also [pricing page](https://azure.microsoft.com/en-us/pricing/details/key-vault/)):
  - Premium HSM RSA-2048 key: $1/month. Operations: $0.03 per 10k. Automated rotation: $1 each.
  - Managed HSM Standard B1: **$3.20/h ≈ $2,336/month**.
- **Throttling:** 2,000 RSA-2048 HSM operations per 10 s per vault ([limits](https://learn.microsoft.com/en-us/azure/key-vault/general/service-limits)).
- **Verdict:** NL region, but paired-region replication, symmetric keys still in preview, and Managed HSM is disproportionate for an alpha.

### 4. Cloudflare-native (Workers secrets, Secrets Store) — not a KEK holder

- **Workers secrets:** encrypted text values exposed to the Worker as `env` bindings. They are not readable in the dashboard or Wrangler after you set them ([Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)).
- **Secrets Store** ([overview](https://developers.cloudflare.com/secrets-store/), [manage](https://developers.cloudflare.com/secrets-store/manage-secrets/), [Workers integration](https://developers.cloudflare.com/secrets-store/integrations/workers/)):
  - Open beta, account-level secrets (100 per account, one store).
  - Role-based admin/deployer roles. Values are retrieved with `await env.X.get()`.
  - Neither product has an **encrypt/decrypt/wrap/unwrap/MAC operation**. The Worker receives the raw secret. There is **no per-use audit log**, only change/audit events for the store.
- **Consequence:** a key held here sits inside the Worker's trust boundary. A Worker compromise can silently exfiltrate it. There is no rate limit, no per-use log, and no revocation that stops offline use. That fails spec 01: "separate trust boundary, audited access".
- **Verdict:** use Cloudflare only to hold the **KMS client credential** (see the credential plan), and optionally the wrapped blind-index root key. No Cloudflare KMS product exists (none found in Cloudflare docs).

### 5. Self-hosted OpenBao / Vault (Transit engine) — not proportionate now

- The Transit engine is a functional fit: encryption-as-a-service, datakey generation, `rewrap` without exposing plaintext, HMAC, and derived per-context keys ([OpenBao transit](https://openbao.org/docs/secrets/transit/)).
- We would have to run an HA cluster in NL (VMs, storage, TLS, patching, backups, monitoring), manage unseal (auto-unseal itself normally relies on a cloud KMS or HSM), and secure the operators.
- That is more operational surface and more insider risk than a managed KMS, for 2–3 tenants. Revisit only if a customer contractually demands non-hyperscaler custody.

### Comparison

| Criterion                      | GCP Cloud KMS (europe-west4, HSM)                            | AWS KMS (eu-central-1)                   | Azure Key Vault Premium (West Europe)        | Cloudflare secrets    | OpenBao self-hosted        |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------- | --------------------- | -------------------------- |
| Key material in NL             | **Yes** (regional key)                                       | No (DE/IE…)                              | Primary NL, async copy to paired region (IE) | No guarantee (global) | Yes, if we host it in NL   |
| Operation path                 | NL; global API front end (no europe-west4 regional endpoint) | Regional endpoint                        | Regional vault endpoint; Entra token global  | In Worker             | Ours                       |
| HSM                            | FIPS 140-2 L3, ~$1/version/mo                                | Included, FIPS 140-3                     | FIPS 140-3 L3 (Premium)                      | No                    | Software unless HSM bought |
| Symmetric wrap with AAD        | Yes (AAD not logged)                                         | Yes (context logged, policy-enforceable) | oct-HSM **preview**; GA = RSA wrap, no AAD   | n/a                   | Yes (derived context)      |
| Native MAC for blind index     | Yes (MacSign)                                                | Yes (no auto-rotation)                   | HS256 on oct-HSM (preview)                   | n/a                   | Yes                        |
| Least privilege                | Encrypt-only / decrypt-only roles per key                    | Key policy + context conditions          | Wrap/unwrap role; per-key discouraged        | All-or-nothing        | Policies per path          |
| Workers auth                   | SA JWT (WebCrypto) → token; WIF with uploaded JWKS           | SigV4 (`aws4fetch`); Roles Anywhere      | Client assertion (cert)                      | Binding               | Token/AppRole              |
| Long-lived secret avoidable?   | No (WIF only moves it)                                       | No (Roles Anywhere only moves it)        | No                                           | n/a                   | No                         |
| Audit of each unwrap           | Data Access logs, **off by default**                         | CloudTrail, **on by default**            | Diagnostic setting, off by default           | **None**              | Audit device               |
| Cost: 6 HSM keys + 100k ops/mo | ≈ $6.30                                                      | ≈ $6.24 (+$1–2/key after rotations)      | ≈ $6.30                                      | $0                    | VM + ops time ≫            |
| Cost: 6 HSM keys + 1M ops/mo   | ≈ $9                                                         | ≈ $8.94                                  | ≈ $9                                         | $0                    | same                       |
| Account to create              | GCP org + billing                                            | AWS account                              | Azure subscription + Entra tenant            | none                  | infra                      |

Cost basis: per-org KEKs for 3 orgs plus a blind-index key plus staging keys ≈ 6 active versions. Log costs are negligible at this volume: about 1.5 KB per entry gives roughly 1.5 GB per 1M operations, inside GCP's 50 GiB free tier.

### Latency estimate (to be measured in #42)

Reasoning: most users are in NL, so the Worker typically runs at Cloudflare AMS. europe-west4 (Eemshaven) and West Europe (Amsterdam area) are about 2–6 ms RTT away; Frankfurt is about 7–10 ms. KMS server time for a symmetric decrypt is a few ms, plus a few more for HSM.

| Path                 | Warm (connection + token cached) p50 / p95 | Cold isolate (TLS + token mint)                                  |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| GCP europe-west4 HSM | ~10–20 ms / ~30–60 ms                      | +1 token round trip (~50–150 ms), avoidable with self-signed JWT |
| AWS eu-central-1     | ~15–25 ms / ~35–70 ms                      | SigV4 signs locally; no token round trip                         |
| Azure West Europe    | ~10–20 ms / ~30–60 ms                      | +Entra token (~50–200 ms)                                        |

Placement matters. If the Worker is pinned near Neon (likely Frankfurt; Neon region still open), a NL KMS adds about 8 ms per call, and vice versa. A list view needing 50 unwraps under the 6-in-flight limit costs about 9 sequential rounds (~150–250 ms). List views should therefore avoid decrypting, or decrypt only the visible page (see Consequences).

## Decision (proposed)

**Use Google Cloud KMS in `europe-west4` (Netherlands) with protection level HSM** as the KEK holder for all environments that hold real data. The runner-up is **AWS KMS in eu-central-1**, chosen only if the owner prefers its on-by-default audit and context-enforced policies over NL residency.

Rationale: it is the only option that keeps key material and crypto operations in the Netherlands with an HSM at per-key pricing (~$1/month per key version). That answers the NL bonus without a dedicated-HSM bill. It offers a clean `fetch`-able REST API, AAD on wrap/unwrap, separate encrypt and decrypt roles per key, native MAC keys, and JIT elevation. Its weaker points (audit off by default, global log buckets, global API front end) are configuration items we can close. AWS's advantages (CloudTrail on by default, context in logs and policies) are real but do not outweigh "no NL region" while NL-only is still an open customer question. If customers say EU is enough, AWS is an equally good choice, and the integration layer below stays provider-agnostic.

### Key hierarchy

```
GCP project per environment (prod, staging; dev/preview = local fake KMS, synthetic data only)
└── key ring  (europe-west4)
    ├── KEK per organization   purpose=ENCRYPT_DECRYPT, HSM, auto-rotate 365 d
    │     wraps per-record DEKs; AAD = "ts:v1|env|org_id|subject_type|subject_id|wrapping_version"
    ├── KEK for blind-index root   purpose=ENCRYPT_DECRYPT, HSM
    │     wraps one random 256-bit blind-index root key per environment (stored in DB/secret, wrapped)
    └── (optional) KEK for documents if files get a separate lifecycle
DEK (per record / per file)  AES-256-GCM, CSPRNG, never stored or cached unwrapped beyond one request
Blind-index subkeys  HKDF-SHA-256(root, info = "bidx|v<n>|<org_id>|<field_code>") → non-extractable HMAC key
```

- **Per-organization KEK rather than one KEK plus AAD.** Per-org KEKs cost about $1 per org per month. They give **crypto-shredding on tenant exit** (destroy the org's key versions, including those protecting backups), per-org audit filtering and later per-org BYOK/EKM. Blast radius is limited at the key level. The Worker identity still needs decrypt on all org keys, so the _access_ separation is only as strong as the app's tenant checks. AAD is always bound as well (org, record, type, version) to prevent wrapped-DEK swapping. Create KEKs during org provisioning with a **separate admin identity** (scripted/IaC), never from the API Worker.
- **Rotation:** automatic yearly KEK rotation. New wraps use the primary version. A scheduled rewrap job (decrypt + encrypt server-side, `wrapping_version` bump, flow 22) migrates DEKs, after which old versions are disabled and destroyed. On suspected DEK or KEK _compromise_, rewrapping is not enough: re-encrypt the data with new DEKs (spec 01).

### Blind-index HMAC keys: KMS MacSign per lookup vs. derived key

|                                             | KMS `MacSign` per lookup/write        | Derived key in Worker (raw secret) | **Proposed: KMS-wrapped root, unwrapped and cached per isolate**      |
| ------------------------------------------- | ------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Latency                                     | +1 KMS call per search/write          | ~0                                 | 1 KMS call per isolate cold start (TTL ≤ 15 min)                      |
| KMS outage                                  | Search and writes fail                | Unaffected                         | Fails only for cold isolates                                          |
| Offline brute force after Worker compromise | No (online oracle, logged, revocable) | Yes, silently, indefinitely        | Yes, after a _logged_ unwrap; mitigated by reindex with a new version |
| Audit                                       | Every lookup                          | None                               | Every unwrap of the root                                              |

Recommendation: the third column. Once a Worker is compromised it can already unwrap every DEK, so caching the index root in memory adds little exposure. In exchange, search does not depend on KMS for every keystroke, and the root never exists unwrapped at rest. Incident playbook: rotate the index root (`index_version`+1, dual-read, reindex). If the security review prefers zero offline exposure, switch to per-lookup `MacSign`; the schema already carries `index_version`.

### Workers integration (illustrative, no real identifiers)

```ts
// packages/crypto/src/kms/gcp.ts — sketch only; real code lands with #74 after this ADR is accepted.
type SaKey = { client_email: string; private_key_pkcs8_b64: string }; // from a Worker secret binding

let cached: { token: string; exp: number } | undefined; // per-isolate memory, never KV/cache

async function accessToken(sa: SaKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    b64ToBytes(sa.private_key_pkcs8_b64),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assertion = await signJwt(key, {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloudkms",
    iat: now,
    exp: now + 3600,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new KmsUnavailable("token"); // no response body in errors/logs
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: now + j.expires_in };
  return j.access_token;
}

export async function unwrapDek(env: Env, keyName: string, wrapped: Uint8Array, aad: Uint8Array): Promise<CryptoKey> {
  const url = `https://cloudkms.googleapis.com/v1/${keyName}:decrypt`; // keyName from kms_key_ref
  const res = await fetchWithBudget(url, {
    // ≤2 retries, ≤300 ms total, jitter
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken(env.KMS_SA)}`, "content-type": "application/json" },
    body: JSON.stringify({ ciphertext: bytesToB64(wrapped), additionalAuthenticatedData: bytesToB64(aad) }),
  });
  if (!res.ok) throw new KmsUnavailable(String(res.status)); // fail closed → 503, never plaintext fallback
  const { plaintext } = (await res.json()) as { plaintext: string };
  const raw = b64ToBytes(plaintext);
  try {
    return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]); // non-extractable
  } finally {
    raw.fill(0);
  }
}
```

The interface stays provider-neutral (`wrapDek`, `unwrapDek`, `deriveIndexKey`) so AWS (`aws4fetch` + `Decrypt` with `EncryptionContext`) can be swapped in. The tests use a local fake KMS.

### Credential handling plan

1. **Identities** (one GCP project per environment):
   - `api-runtime` SA: `cryptoKeyEncrypter` + `cryptoKeyDecrypter` on the org KEKs and the index KEK, granted at key or key-ring level.
   - `rewrap-job` SA: separate, both roles, used only by the rotation job.
   - `kms-admin`: humans, with no decrypt role.
   - Where cheap, split write and read: e.g. an `import`/write-only Worker gets encrypter only.
2. **Secret storage:** the SA private key (or the WIF signing key) is stored as a **Worker secret per environment** via `wrangler secret put`. It never goes in `.dev.vars` for prod/staging, CI logs, the repo or laptops after upload. Production deploys need a human approval (CI/CD policy).
3. **Org policy:**
   - Keep `iam.disableServiceAccountKeyCreation` enforced at the org level, with an exception only on the KMS project.
   - Set `iam.serviceAccountKeyExpiryHours` to 2160 h (90 days).
   - Rotate with two overlapping keys.
   - Alert on any `CreateServiceAccountKey`.
4. **Evaluate WIF with uploaded JWKS** (ES256 key in the Worker, no Google-issued key) in #42. Adopt it if the token-exchange latency is acceptable.
5. **Token caching** in isolate memory only, refreshed 60 s before expiry. Never in KV, Cache API or Durable Object storage. Try the self-signed-JWT bearer to drop the token round trip.
6. **Detection:**
   - Data Access logs enabled for `cloudkms.googleapis.com`. Log buckets and org default location set to `europe-west4`.
   - Log-based alerts for: decrypt by any principal other than `api-runtime`/`rewrap-job`; decrypt rate above baseline; `PERMISSION_DENIED` spikes; key disable/destroy/IAM-policy changes; SA key creation.
   - App-side: our own `security_events` with org/record IDs, because GCP does not log AAD.

### Outage behaviour

- **Fail closed:** no plaintext fallback, no writes of unencrypted PII, no long-lived plaintext DEK cache. Reads return 503 with a Dutch-first i18n error. Writes are rejected or queued and retried idempotently for background jobs.
- **Bounded retries** with jitter, plus a per-isolate circuit breaker. KMS errors and latency go to metrics without key names or IDs in user-facing errors.
- **Quotas:** the alpha load is many orders of magnitude below the GCP limits. Monitor quota usage and design bulk exports and reindexing as throttled jobs.

### Break-glass and operator access (D12)

- No human has a standing decrypt role in prod.
- Break-glass uses a **Privileged Access Manager entitlement**: decrypter on one org KEK, ≤ 1 h, with justification and approval. It is exercised only through an audited internal tool (no raw key export, no plaintext on laptops), and every use is alerted.
- Owner/admin accounts use phishing-resistant MFA. Billing and KMS admin are separate identities.
- Destruction safety: a 30-day scheduled-destruction window (org-policy minimum), documented key inventory and custody, and a recovery runbook tested in the tabletop exercise (spec 01).

## Consequences

- **Easier:**
  - One small provider-neutral `packages/crypto` KMS adapter with no SDK dependency, in line with the supply-chain ADR 0005.
  - Per-org crypto-shredding gives a clean answer for tenant offboarding and backups.
  - Costs are about $10/month in alpha and grow by ~$1 per org per month.
- **Harder:**
  - A new cloud vendor and subprocessor (Google Cloud EMEA) to add to the DPA/subprocessor register. Its transfer assessment must cover the global API front end and the token endpoint.
  - A long-lived credential exists in Cloudflare. The Cloudflare account becomes part of the key-access trust boundary, so it needs MFA and least-privilege API tokens.
  - Every PII read adds a KMS round trip. UX for lists and search must be designed around this (paginate decrypts, show non-sensitive fields, exact blind-index search per D06). This must meet the #42 target (p95 read with decrypt < 150 ms).
- **Security:** a DB-only dump is useless without KMS. A compromise of Worker plus credential allows decryption, but it is logged, alertable, rate-limited and revocable (disable the SA key or the KEK version). This does not protect against a malicious authorized user; MFA, RBAC and telemetry cover that (spec 01).
- **Privacy:** key material and crypto operations stay in the NL region. KMS audit logs contain no PII, provided AAD and resource names never contain personal data, which is our rule.

## Rollback

- The schema stores `kms_key_ref`, `wrapping_version` and `cipher` per envelope, so the provider can be changed by a **rewrap migration**. Decrypt each DEK with the old KMS, encrypt with the new one, and update the ref and version. Record ciphertext is untouched.
- Cost: one decrypt plus one encrypt per envelope (cents at our volume), a dual-provider adapter for the migration window, and a few days of engineering.
- If no KMS is ever adopted, we would fall back to a Worker-secret KEK. That would violate spec 01 and require a new ADR.

## Open items / decisions for the owner

1. **Pick the provider and create the account:**
   - Recommended: a **Google Cloud organization** (Cloud Identity on a TalentStroom domain, which depends on #9) with a billing account in EUR, then projects `prod` and `staging`.
   - Runner-up: an **AWS account** (Organizations and a separate security account later).
2. **NL-only vs EU** (stakeholder question 1). If EU is enough, AWS eu-central-1 becomes equal, and GCP europe-west3 gains an in-region TLS endpoint.
3. **HSM vs SOFTWARE protection level.** Recommended: HSM. The difference is about $1 vs $0.06 per key version per month.
4. **Per-org KEKs (recommended) vs one KEK per environment plus AAD** for the alpha.
5. **Blind-index strategy:** cached KMS-wrapped root (recommended) vs per-lookup `MacSign`.
6. **SA key vs WIF-with-uploaded-JWKS** after the #42 measurement. Accept a 90-day credential rotation duty either way.
7. **Break-glass approvers:** who approves (two-person rule?), and whether the PAM tier needed for approvals is acceptable.
8. **Worker placement:** pin near Neon or near KMS. This depends on the Neon region chosen in #42.
9. **Retention of KMS audit logs:** 400 days in `_Required` vs a longer retention in an NL bucket.

## Follow-up issues (to create)

- #42: measure p50/p95/p99 unwrap from Workers (AMS and with placement hints) for GCP europe-west4 HSM, plus one AWS eu-central-1 control. Include the cold token mint and the 6-connection fan-out.
- GCP org bootstrap runbook/IaC: org policies, log default location europe-west4, Data Access logs, key rings, IAM, PAM entitlement, alerts. Synthetic data only until reviewed.
- `packages/crypto`: provider-neutral KMS adapter, fake KMS for tests, AAD canonical encoding, fail-closed errors (#74).
- Blind-index root key: HKDF derivation, `index_version` dual-read and reindex job.
- Rewrap/rotation job (flow 22) with coverage verification.
- Subprocessor/DPA update for the chosen KMS vendor, plus a transfer note on the global API front end.
- Verify that IAM Conditions and PAM apply to Cloud KMS key-level grants as described; adjust the break-glass design if they do not.
