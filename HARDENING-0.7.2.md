# Onboard 0.7.2 hardening implementation

September 30, 2026. Local build and source package; not installed or deployed. Native/service 0.7.2; add-in packages and Teams action handler 0.6.1. This document updates the earlier [production review](PRODUCTION-READINESS-REVIEW.md); it does not declare production or CUI readiness.

## Implemented and tested

| Review area | Implementation | Remaining boundary |
|---|---|---|
| SEC-01: credential/decryption helpers | Removed caller-selected credential read/write/delete and direct decryption CLI interfaces. Helpers now require an unguessable, ten-second, one-use service ticket bound to operation, settings and Microsoft account epoch. Ticket cleanup covers success, failure and timeout; permission is checked before and after the helper. The claim handler is native-only. | A compromised same-user service remains inside the trust boundary; managed installation and endpoint protection still matter. No actual customer Keychain item was accessed by the tests. |
| SEC-02: managed policy | Added `managed-public` build mode. Missing administrator policy blocks processing instead of reverting to development. Administrators can deny computer control and restrict task website domains. | This remains PUBLIC-only. It does not make a declaration or editable metadata authoritative classification, implement rights-aware MIP, or enable CUI/FCI. |
| SEC-03: changed Word labels | Before insertion, Word recaptures the document and the service compares current supported label metadata/text with the inspected snapshot. Re-capture does not replace the original reviewed selection. A disconnect during authorization prevents insertion. | Office mutation is not an atomic MIP-rights transaction. Protected output, recipient rights, authoritative labels and broader protected-content support remain open. |
| SEC-04: native identity | Managed builds verify their bundle and resources, then use macOS Security.framework to validate the requesting process against the app's designated code requirement. Existing path/hash checks remain. Tests accept the matching running app, reject an unrelated process, and reject modified resources. | Production needs the owner's trusted signing identity, notarization, controlled installation, least-privilege worker isolation and a signed update/rollback policy. The test build is ad hoc. |
| SEC-04 / OPS-02: package and install | Build verifies the actual ZIP after extraction outside the sync-managed workspace. Installer verifies a full candidate before replacing the app, preserves the previous version, and restores it if final verification fails. Production packaging rejects ad-hoc signing or development policy mode. | The working-copy app in the sync-managed folder may still have invalidating Finder metadata; it is explicitly diagnostic, not the verified installation artifact. Process/power-loss transactional installation recovery and fleet update authorization remain additional work. |
| SEC-05: retention | Saved tasks expire after seven days from creation, checked before reopening; administrators may set 1–30 days. New model spill directories carry a boot marker; a subsequent model request cleans private, marked directories from prior boots. Same-boot, unknown or unsafe directories are preserved to avoid touching a live worker. | Local inference still requires plaintext working files. This is conservative cleanup, not encrypted spill storage, guaranteed erasure or same-boot orphan recovery. Backups and previously unmarked runs require an approved disposition process. |
| SEC-06: controllers | A managed administrator can deny computer control and restrict configured task domains. Existing exact-action reviews, observation binding and one-use native tickets remain. | Browser navigation/network enforcement and business-level privileged action permissions are not supplied by an AX click review. No privileged tenant administration was performed. |
| DEP-01: sovereign bot trust | Explicit `commercial`, `gcc-high` and `dod` profiles select fixed issuer, OpenID metadata and key endpoints. Key caches are separated by metadata authority. Cross-cloud issuer and wrong-tenant tests fail closed. The package generator accepts `--cloud`. | Actual customer bot registrations, approved hosting, tenant capabilities, CAC/CA and GenAI validation are still required. Existing message handoff fragments and remote SDK dependencies still need the deployment's data-flow assessment. |
| OPS-01: audit | Bounded, private local JSONL records cover accepted/processed requests, policy denials and tool-review decisions. Fields are allowlisted and omit prompt, message, credential and source bodies. Correlation IDs are hashed. Unsafe files fail closed; rotation retains at most approximately four MiB. | These files are not tamper-proof or a complete compliance audit. Central collection, actor/policy/destination evidence, protected retention, incident procedures and monitoring remain open. |
| OPS-02: availability | TLS handshakes run inside the bounded worker pool instead of blocking listener acceptance. Teams metadata is bounded while streaming and readers are cancelled. Unknown signing keys trigger a rate-limited refresh. `/readyz` distinguishes missing configuration from liveness. | Load testing, supervisor hard-failure recovery and a production availability target still need qualification. Readiness is configuration, not a successful customer integration. |
| OPS-02: certificates | Startup refuses expired/unreadable local certificates with a specific diagnostic. Readiness shows expiry/near-expiry. Existing trust and certificate files are preserved. | Managed renewal/distribution and approved certificate trust remain administrator operations; no trust setting was changed. |

## Build and configuration

Development builds keep their existing behavior unless a managed profile is explicitly selected. A managed PUBLIC build requires an administrator-owned policy at `/Library/Application Support/Onboard AI/managed-policy.json`; existing policy file/parent ownership and no-symlink checks still apply.

The build script recognizes these environment variables:

- `ONBOARD_POLICY_MODE=managed-public`: requires organization policy at runtime.
- `ONBOARD_SIGNING_IDENTITY`: the owner's installed signing identity; absent defaults to development ad-hoc signing.
- `ONBOARD_PRODUCTION_BUILD=1`: rejects ad-hoc signing and non-managed policy mode. This gate is necessary, not sufficient for production authorization. Notarization and customer controls remain separate.

Optional administrator-policy fields:

```json
{
  "allow_computer_control": false,
  "allowed_browser_domains": [],
  "task_retention_days": 7
}
```

These extend the existing complete schema; this fragment alone is not a policy file. A managed build defaults to denying computer control and unapproved task domains. Retention deletion occurs on access after account/policy validation. Expired tasks must be recreated from a newly reviewed plan; they are never automatically rerun.

For government Teams packaging, pass `--cloud gcc-high` or `--cloud dod` to `tools/package_teams_actions.py` with the real approved origin, bot ID and tenant ID. This produces configuration and packages only; it does not provision or deploy resources. The inbound issuer is `https://api.botframework.us`, with metadata and signing keys under `login.botframework.azure.us`; the commercial profile stays under its separate `.com` authorities. This implementation does not request outbound bot OAuth tokens, so the differing GCC High/DoD token-service URLs are not used. See Microsoft's [government Bot Framework configuration](https://learn.microsoft.com/en-us/azure/bot-service/how-to-deploy-gov-cloud-high?view=azure-bot-service-4.0) and [sovereign cloud guide](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-sdk/essentials/app-configuration/sovereign-cloud).

## Verification and deployment status

- Python tests: **363 passed**.
- Add-in JavaScript tests: **77 passed**.
- Teams handler/server tests: **11 passed**, including both government profiles and cross-cloud rejection.
- Rust tests: **4 passed**.
- Native helper/code-identity checks: **6 passed**, without Keychain access or a live-service connection.
- Native AES-GCM checks: **4 passed**, using an ephemeral in-process test key.
- Native compile, staged signature and exact ZIP extraction/signature verification: **passed**. Publisher signature/notarization was not established.

The count of automated suite tests is 455; the native boundary/encryption checks are listed separately. All fixtures are test-only. No real mail was sent, no GUI task or tenant administration executed, no customer data sent to AI, and no app installed/restarted. Government metadata was fetched read-only from Microsoft's public endpoint; this is not live tenant acceptance.

Evidence: `evidence/hardening-python.txt`, `hardening-web.txt`, `hardening-bot.txt`, `hardening-build.txt`, `hardening-native.json`, and `hardening-crypto.txt`. Run `tools/check_native_hardening.py` only after a verified build; it launches temporary CLI-only app processes and does not access the running service.

## Still required before production

The remaining items include engineering work, not merely paperwork: rights-aware MIP/classification and protected output; encryption/minimization of model spill storage; stricter worker/browser isolation and typed privileged actions; signed release/update provenance and crash-safe installer recovery; centrally protected audit and fleet operation; CI and independent testing across supported hosts. Customer-specific signing identities, approved government infrastructure, real GenAI/CAC testing and applicable authorization evidence are also required. Those are not marked complete by this hardening pass.
