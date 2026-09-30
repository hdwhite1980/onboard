# Onboard 0.7.3 — isolation, audit, updates and Activity

September 30, 2026. Local source/build only. This supersedes the corresponding implementation status in the 0.7.2 report, without declaring production, FCI or CUI readiness. The signed-in app has not been installed over or restarted; nothing was deployed or published.

## User-visible Activity

Choose **Activity** in the native sidebar. It refreshes every three seconds and shows queued/active/completed/failed requests, local/cloud stages, the service PID, and model supervisor/worker PIDs reported by an active request. It does not enumerate unrelated applications. Model PIDs are observations from the active request, not continuous OS process inspection. Failures have stable codes and suggested next steps; failed requests produce a sidebar badge.

The view shows last-completed local-run model memory/timing metrics when available. These are not live system-wide CPU/RAM readings. Opening Activity no longer cancels work in progress. **Export diagnostic log** saves a JSON report to a user-chosen location. Reports omit prompts, source content, credentials and model answers. Activity events are bounded to 200 and reset at service restart; the most recent sanitized local runtime diagnostic persists. Existing request results in Ask AI still show the specific error.

## Implemented controls

| Area | Change | Verified / remaining |
|---|---|---|
| Model temporary storage | Each request uses a unique AES-256 encrypted APFS sparse image. Its random passphrase is passed through stdin and retained only in memory, not argv, configuration, Keychain or logs. Prompt, source, tokenizer packet, model activation copy, response and runtime logs are under that encrypted mount. No plaintext fallback. | A real local-model request succeeded and normal detach/deletion completed. This is backing-file encryption, not secure erasure, FIPS validation, or protection against a compromised account reading a mounted volume or process memory. macOS swap/backups remain OS controls. |
| Abandoned temporary storage | Markers contain owner PID and boot identity. Under the provider lock, a later request may detach an exact marked image belonging to a dead owner. It never kills a process or force-detaches a volume. Live, busy, unknown or mismatched volumes block processing for administrator recovery. | Normal cleanup and conservative recovery failure paths tested. Old unmarked plaintext directories are preserved for an approved disposition process. |
| Worker isolation | Existing network denial is supplemented by OS-enforced read boundaries for runtime/system files and the current request, writes restricted to request storage and `/dev/null`, and child-process restrictions. Memory, pressure, thermal, integrity and lifecycle guards remain. | Actual sandbox negative controls and one full local inference passed. The supervisor still has broader privileges. Production still needs an independently qualified, managed runtime/installation and broader adversarial testing. |
| Browser isolation | Managed browser inspection/actions/opening are blocked unless administrator policy explicitly attests `browser_network_enforced`. This must correspond to real externally enforced browser egress restrictions. Reviewed `web_read` remains bounded HTTPS, approved-host, no-redirect retrieval. | Denial tested. An AX controller does not itself enforce browser subresources, scripts, redirects or DNS. Administrators must deploy and verify browser/proxy/network controls before asserting the policy flag; toggling it alone is not protection. |
| Central audit | Optional mTLS delivery; managed builds require a configured collector. Before relevant processing, the collector must acknowledge the exact event hash following a durable append. No redirects, unverified TLS, or direct retry when a proxy is configured. Content-free context includes hashed actor, policy and provider destination, plus cloud profile. | Real loopback mTLS/receipt and rejection tests passed. No customer collector exists/configured here. Collector deployment, certificates, retention, backups, SIEM integration and incident operations remain deployment work. |
| Collector | `operations/audit_collector.py` exposes only an authenticated append endpoint. Client certificates must chain to the configured CA and have an allowed SHA-256 fingerprint. Bounded input/workers, FULL synchronous SQLite commits, event idempotency, changed-replay rejection and a record hash chain are implemented. | Endpoints have no API to read/delete/rewrite history. The central host operator can alter the database: this is not immutable/WORM storage or an externally anchored tamper-proof ledger. Use a dedicated server identity and protected backups/retention. |
| Signed releases/updates | Tools support Developer ID identity checks, Apple notarization/stapling, detached RSA/SHA-256 signed release metadata, exact ZIP hashes, expiry and monotonically increasing build numbers. The administrator-operated update installer pins a root-owned release public key and Apple Team ID; verifies the app, manifest and notarization; rejects rollback/replay and unsafe archives. | Signature/tampering/rollback/expiry tests passed with ephemeral test keys. No production release key or Developer ID Application identity is configured. No notarization submission was made. Only an Apple Development identity was found on this Mac. |
| Installer recovery | Exclusive installation lock; durable journal before renaming the old app; candidate verification and flushing; backup preservation; conservative interrupted-install recovery on the next install. | Simulated interruption and rollback tests passed. Actual power-loss qualification and fleet rollback procedures remain external acceptance work. |
| Purview boundary | Managed builds reject labeled inputs until a validated rights-aware integration exists. Labeled-source export/send cannot silently create an unlabeled copy, even when a development PUBLIC mapping exists. Unknown protection bits are rejected. | This closes a downgrade path; **it does not implement the MIP SDK**. Protected-document read, rights-aware transformations, preserved/reapplied protection and recipient licensing remain unimplemented and blocked. |

## Purview completion requirements

Microsoft's MIP SDK is the required integration for evaluating rights on protected material. Its File SDK exposes checks such as Extract; an application must enforce the appropriate rights and preserve output protection. A Graph access token or editable DOCX label field is not a substitute. The development environment needs the macOS C++ SDK and a configured test tenant/app. Microsoft's setup identifies delegated Azure Rights Management `user_impersonation` and Information Protection Sync Service `UnifiedPolicy.User.Read` permissions. Customer/cloud-specific scope and endpoint selection must be validated, not inferred from a commercial test. See [MIP setup](https://learn.microsoft.com/en-us/information-protection/develop/setup-configure-mip) and [access checks](https://learn.microsoft.com/en-us/information-protection/develop/concept-accesscheck).

The remaining engineering includes SDK packaging and token acquisition, authenticated rights evaluation on original bytes, operation-specific authorization, protected output generation, recipient rights, revocation/offline behavior, and end-to-end tests. Public redistribution also requires Microsoft's IPIA process; the documentation distinguishes internal-only use. No agreement was accepted or account permissions changed here.

## Central audit enrollment

Deploy the collector in the approved environment, separate from endpoints. Supply a server certificate, key, client CA and exact client certificate fingerprints. Run it under a dedicated service identity with a private state directory; configure the service manager, firewall, storage capacity monitoring, backup and retention policies. The provided server defaults to loopback, so an administrator must deliberately select an approved bind address.

An administrator-owned `managed-policy.json` can include:

```json
{
  "require_central_audit": true,
  "central_audit": {
    "endpoint": "https://audit.example.gov/v1/events",
    "ca": "/Library/Application Support/Onboard AI/audit/ca.pem",
    "certificate": "/Library/Application Support/Onboard AI/audit/client.pem",
    "private_key": "/Library/Application Support/Onboard AI/audit/client-key.pem",
    "proxy": ""
  },
  "browser_network_enforced": false
}
```

This is an illustrative fragment, not a deployable policy or a real endpoint. Use the existing full policy schema. Paths and ancestors must not be writable by other users or symlinked; the private key must have no group/other access. A deployment must protect the client key against misuse. The client honors configured/system proxy restrictions and fails closed if the collector does not durably acknowledge an operation. An outage therefore blocks managed processing; Activity remains available for diagnostics. Do not enable the browser flag before network controls have been independently verified.

## Release operation

1. Enroll a **Developer ID Application** identity and a notarization Keychain profile. An Apple Development identity is insufficient for this distribution path. See [Apple's notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow).
2. Build using `ONBOARD_PRODUCTION_BUILD=1`, `ONBOARD_SIGNING_IDENTITY` and `ONBOARD_SIGNING_TEAM`. Managed-public mode is mandatory. This does not itself make the app production-ready or make the externally retained model/runtime portable.
3. Run `tools/production_release.py notarize` with `--app`, a new `--out` directory, `--team`, `--notary-profile` and an offline `--signing-key` file. This explicit operation uploads the app to Apple; it was not run here. Protect the private release key outside the source tree and CI logs.
4. Install root-owned `/Library/Application Support/Onboard AI/update-policy.json` containing `team`, absolute `public_key` path and integer `minimum_build`. Provision the trusted key out-of-band; never take it from the downloaded release.
5. After arranging a safe service shutdown, an administrator runs `tools/install_update.py <release-directory>`. It targets `/Applications/Onboard AI.app` and does not force-stop a service. Managed destination/runtime ownership and endpoint policy must be enforced separately. Previous versions are retained for deliberate administrator recovery; automatic updates cannot downgrade.

This is an explicit administrator-operated update path. There is no unattended update downloader, fleet rollout service, automatic certificate enrollment or automatic rollback authorization.

## Validation evidence

- Python regression suite: 377 passed (including signed-manifest failures, audit delivery failure, browser denial, labeled-output rejection, crash recovery and sanitized Activity export).
- Add-in JavaScript: 77 passed. Teams handler/server: 11 passed. Rust: 4 passed.
- Eight real storage/sandbox/mTLS checks passed using harmless fixtures and temporary test certificates. No OS trust setting changed.
- A full local model run summarized an actual public product requirement successfully in approximately 32 seconds, with encryption, the stricter worker sandbox and existing guards enabled. It did not contact cloud AI or use customer data. One successful run is not a sustained-load or fleet qualification.
- Six native helper/code-identity checks also passed without Keychain or live-service access.
- Native app compilation and exact extracted-ZIP signature verification passed with development signing. No publisher/notarization claim is made.

Evidence files are under `evidence/hardening-073-*`. The software is still not ready for protected government content. The MIP engineering, production signing/enrollment, approved collector/browser controls, runtime distribution, broader isolation assurance and actual commercial/GCC High/DoD acceptance must be completed before that claim can change.

Owner follow-up: an Apple Developer account is available, and the owner can arrange a MIP test tenant and administrator consent. The appropriate Developer ID identity/profile and approved MIP tenant/app details have not yet been enrolled in this build.
