# Browser push research — issue #457

Date: 2026-10-31. Decision: [proposed ADR 0017](../../adr/0017-browser-push-notifications.md). Scope: documentation and a disposable, synthetic local-runtime experiment within the two-day spike timebox. No app code, dependencies, migrations, credentials or deployment changed; no provider enrollment or messages sent.

## Findings and primary sources

- **Privacy:** message encryption protects content from the intermediary, but timing, frequency and size remain visible to the push service. Subscription endpoints and keys must be treated as sensitive, linkable routing capabilities. Fixed generic content reduces lock-screen disclosure without making the channel anonymous. Source: [W3C Push API, security/privacy and subscription sections](https://w3c.github.io/push-api/). The provider also sees sender network/protocol information; do not claim EU-only delivery. Provider-specific retention and transfer assessment remains a launch gate, not a conclusion of this spike.
- **Payload transport:** use `aes128gcm` with ECDH, HKDF-SHA-256 and AES-128-GCM; transport encryption is separate from VAPID authentication. RFC 8291's single-record calculation allows up to 3,993 plaintext octets within the 4,096-octet supported message-body size; our fixed payload is 25 bytes. Adding the minimum delimiter, 16-byte authentication tag and 86-byte header gives a calculated **128-byte encrypted body** with no extra padding, excluding HTTP headers/TLS. This is a calculation, not an observed provider request. Source: [RFC 8291 §§3–4](https://www.rfc-editor.org/rfc/rfc8291.html).
- **VAPID:** ES256 signs a JWT containing push-service-origin audience and expiry no more than 24 hours away; a contact URI identifies the service operator. A restricted subscription is tied to the application-server public key, so rotation needs re-subscription. Choose one-hour tokens and a generic service contact; use different signing and encryption keys. Source: [RFC 8292 §§2–4](https://www.rfc-editor.org/rfc/rfc8292.html).
- **Workers:** native Web Crypto supports the required ECDSA, ECDH, HKDF and AES-GCM operations. This supports feasibility without a separate signer; it does not establish compatibility of any npm Web Push library. Source: [Cloudflare Workers Web Crypto supported algorithms](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/). The experiment below used those primitives without Node compatibility flags; the app's existing `nodejs_compat` configuration is unchanged.
- **Permission/browser UX:** the Push API uses secure contexts and subscription permissions; `expirationTime` can be null and permission changes may produce a subscription-change event. Reconciliation on signed-in visits is still necessary. Source: [W3C Push API](https://w3c.github.io/push-api/). On iOS/iPadOS, WebKit introduced Web Push for Home Screen apps in 16.4, with a direct user interaction required for permission. macOS standards-based Safari support began in 16.1. Feature detection and actual current-browser testing remain necessary. Source: [WebKit's platform announcement](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/). Our stricter never-first-visit/settings-only policy is a product decision.
- **Delivery and revocation:** request TTL is mandatory; the service may shorten it. Expired subscriptions return 404 in the standard; handle provider 410 expiry responses too, validating interoperability in #465. A successful send does not establish that a person saw/read the notification. Best-effort delivery plus already-accepted messages prevents an instantaneous remote-recall guarantee. Source: [RFC 8030 §§5–7](https://www.rfc-editor.org/rfc/rfc8030.html). Five-minute maximum TTL, 90-day inactive enrollment expiry and retry bounds in the ADR are proposed policies, not measured provider defaults.

## Measurements

Environment: Node **26.13.0**, pnpm **12.16.1**, installed Miniflare **5.20261019.1-beta**, workerd **1.20261019.1**, compatibility date **2026-10-26** (matches apps/api). Reuse the lockfile installation; no new packages. Miniflare 5 requires the worker/config/manifest API used below; older single-worker examples do not apply.

Method: one untimed warmup request, then ten sequential local dispatches. Each generates an ephemeral signing key, exports its JWK, imports/signs/verifies the same synthetic JWT 100 times, rejects a changed signing input, and runs an ECDH/HKDF/AES-GCM primitive round trip. Measure dispatch through JSON response consumption using the **Node host's** monotonic clock; workerd's intra-request clock is unsuitable for this benchmark. Startup/warmup is excluded; per-dispatch overhead, key generation and the primitive round trip are included. No network call to a push provider occurs. Synthetic `.invalid` audiences/contact and ephemeral keys never leave the probe; output contains only counters, sizes and durations.

| Measurement | Observed result |
| --- | --- |
| Import + ES256 sign + verify | 1,000 / 1,000 passed (10 × 100), plus excluded warmup |
| Changed-input negative control | Rejected in all 10 measured batches |
| Raw ES256 signature / uncompressed public key | 64 / 65 bytes |
| ECDH shared-secret agreement + HKDF/AES-GCM round trip | Passed in all 10 measured batches |
| Fixed generic payload UTF-8 size | 25 bytes |
| Primitive AES-GCM ciphertext size | 41 bytes (25 + 16-byte tag; **not** a framed Web Push body) |
| Batch host wall time, ms | 12.245, 10.815, 10.830, 10.892, 10.818, 10.943, 10.431, 11.132, 10.539, 9.942 |
| Batch minimum / median / maximum | 9.942 / 10.824 / 12.245 ms |
| Median batch time / 100 operations | 0.10824 ms; includes the overhead described above |

Interpretation: native cryptographic operations work in the installed Workers runtime, and signing is small in this local workload. The denominator is **a batch**, not an individual notification latency distribution. These numbers are not deployed Worker CPU billing, a throughput capacity, a p95 delivery result or an SLA. The probe is neither a complete RFC 8291 encryption implementation nor a test-vector/interoperability test. It uses a fixed IV only for a disposable primitive check with a newly derived ephemeral key; never copy it into a sender. A production sender must implement fresh random salt/key material and full framing via reviewed code.

## Reproduction

From the repository root after its normal `pnpm install`, save the following as `/tmp/adr-457-measure.mjs` and run `node /tmp/adr-457-measure.mjs`. It resolves the already-installed Miniflare through apps/api's Wrangler, runs locally, disposes its runtime, and throws on any incorrect result. Remove the scratch file afterward. Timing will vary across runs and hardware. This fenced research probe is not application code or a dependency proposal.

```js
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
const appRequire = createRequire(`${process.cwd()}/apps/api/package.json`);
const wranglerRequire = createRequire(appRequire.resolve('wrangler'));
const { Miniflare } = wranglerRequire('miniflare');
async function probe() {
  const s = crypto.subtle;
  const enc = new TextEncoder();
  const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  const signing = await s.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await s.exportKey('jwk', signing.privateKey);
  const input = enc.encode(`${b64(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})))}.${b64(enc.encode(JSON.stringify({aud:'https://push.example.invalid',exp:Math.floor(Date.now()/1000)+3600,sub:'mailto:push@example.invalid'})))}`);
  let passed = 0;
  let signature;
  for (let i = 0; i < 100; i++) {
    const key = await s.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    signature = await s.sign({name:'ECDSA',hash:'SHA-256'}, key, input);
    if (signature.byteLength !== 64 || !await s.verify({name:'ECDSA',hash:'SHA-256'}, signing.publicKey, signature, input)) throw new Error('sign/verify failed');
    passed++;
  }
  const changed = new Uint8Array(input); changed[0] ^= 1;
  if (await s.verify({name:'ECDSA',hash:'SHA-256'}, signing.publicKey, signature, changed)) throw new Error('tamper accepted');
  const a = await s.generateKey({name:'ECDH',namedCurve:'P-256'}, true, ['deriveBits']);
  const b = await s.generateKey({name:'ECDH',namedCurve:'P-256'}, true, ['deriveBits']);
  const ab = await s.deriveBits({name:'ECDH',public:b.publicKey}, a.privateKey, 256);
  const ba = await s.deriveBits({name:'ECDH',public:a.publicKey}, b.privateKey, 256);
  if (b64(ab) !== b64(ba)) throw new Error('ECDH mismatch');
  const base = await s.importKey('raw', ab, 'HKDF', false, ['deriveKey']);
  const aes = await s.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(16),info:enc.encode('synthetic primitive probe')}, base, {name:'AES-GCM',length:128}, false, ['encrypt','decrypt']);
  const payload = enc.encode('{"v":1,"type":"activity"}');
  const iv = new Uint8Array(12);
  const cipher = await s.encrypt({name:'AES-GCM',iv}, aes, payload);
  const plain = await s.decrypt({name:'AES-GCM',iv}, aes, cipher);
  if (b64(plain) !== b64(payload)) throw new Error('AES mismatch');
  return Response.json({passed, tamperRejected:true, signatureBytes:signature.byteLength, publicKeyBytes:(await s.exportKey('raw', signing.publicKey)).byteLength,payloadBytes:payload.byteLength,cipherBytes:cipher.byteLength,ecdhHkdfAesRoundtrip:true});
}
const mf = new Miniflare({workers:[{config:{name:'probe', compatibilityDate:'2026-10-26', manifest:{mainModule:'probe.mjs', modules:{'probe.mjs':{type:'esm',contents:`export default {fetch: ${probe.toString()}};`}}}}}]});
try {
  await mf.dispatchFetch('https://probe.invalid'); // warmup, excluded
  const timings = [];
  let result;
  for (let i=0;i<10;i++) {
    const start=performance.now();
    const response = await mf.dispatchFetch('https://probe.invalid');
    result=await response.json();
    if (!response.ok) throw new Error('probe failed');
    timings.push(Number((performance.now()-start).toFixed(3)));
  }
  console.log(JSON.stringify({node:process.version,miniflare:wranglerRequire('miniflare/package.json').version,workerd:wranglerRequire('workerd/package.json').version,batches:10,operationsPerBatch:100,batchWallMs:timings,result},null,2));
} finally { await mf.dispose(); }
```

## Unmeasured work and launch gates

No browser matrix, permission conversion, real provider acceptance, device display, locked/offline delivery, remote revocation latency, sender-package bundle size or deployed CPU/egress cost has been measured. No such outcome is inferred from the crypto benchmark. Real subscription endpoints are intentionally absent from these notes.

[#463](https://github.com/EmVeeNL/talent-stroom/issues/463) covers protocol vectors/interoperability, protected subscription storage, authorization, key rotation, SSRF defenses and retention. [#464](https://github.com/EmVeeNL/talent-stroom/issues/464) covers permission UX, service worker and Dutch/English keys. [#465](https://github.com/EmVeeNL/talent-stroom/issues/465) requires at least 30 synthetic sends per supported environment (Chromium/Firefox desktop, Safari macOS, Chrome Android, iOS/iPadOS Home Screen), exact versions, display failure counts and observed p50/p95 with missing deliveries reported separately. Include background/locked/offline/Focus states, expiry, revoked membership, account switch, all-device revocation, stale workers, moved/cancelled reminders and rollback. Review sanitized network/log/storage captures and provider privacy roles/retention/transfers before enabling production sends.

All three issues were created as technical tasks under epic #452, explicitly gated by acceptance of ADR 0017. They coordinate the existing in-app centre #456 and email preference story #235 rather than duplicating those features. Implementation must begin with failing synthetic BDD tests, preserve server-side membership checks, add Dutch-source i18n keys for user-facing copy and pass `pnpm check`.
