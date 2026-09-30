**Implementation update:** [0.7.3 hardening and Activity](HARDENING-0.7.3.md) supersedes the corresponding fix status below. Protected-content and production acceptance are still open.

# Onboard AI production, security and compliance review

**Implementation update:** [Hardening 0.7.2](HARDENING-0.7.2.md) supersedes the implementation status below. It fixes helper authorization, adds managed running-code checks, verifies the packaged ZIP, adds rollback, fresh Word metadata checks, sovereign bot profiles and further controls. The original findings are retained as the review record; production readiness is still not established.

Review date: September 30, 2026. Targets: commercial Microsoft 365, GCC High, and DoD. Reviewed baseline: native/service 0.7.0 and add-ins/bot 0.6.0, with locally built review fixes in native/service 0.7.1. Prior published baseline: `3ed031d89008aae6ede05a5baa9b3de87bcba2e4`.

**Decision: not ready for production on any of the three targets.** The current implementation is a public-content development prototype with useful defensive controls. It is not a CUI/FCI processing boundary, a completed government deployment, or an authorization package. A controlled commercial public-data pilot is the nearest practical milestone, after the high-priority local security and release issues below are closed. Existing operation was not stopped or restarted during this review.

## Scope and evidence

Reviewed the active SwiftUI dashboard and privileged helpers, Python local service and network adapters, Rust policy/grounding boundary, Outlook/Teams/Word interfaces, Teams action handler and hosting server, local runtime integration, saved tasks/workspace, installation/update/export scripts, dependency locks and associated tests. The working-source inventory covers 394 files across the integrated product, local AI support and briefing core. This is an inventory count, not a claim that every line of historical research or third-party code received equal manual analysis.

Evidence is under `evidence/production-review-*`. The review combines manual data-flow analysis, isolated failure reproductions, existing automated suites, an OSV advisory query, a narrow credential-pattern scan, and a local native build. It does not include penetration testing of a deployed tenant, cloud subscription posture, deployed secrets, live CAC/Conditional Access, actual GenAI.mil processing, a new model benchmark, or an independent compliance assessment. No customer content or credential was sent to the advisory service. Test fixtures are isolated regression inputs, not substituted product data or evidence of live integrations.

## Confirmed defects corrected in 0.7.1 source

| ID / priority | Trigger and impact | Correction and evidence |
|---|---|---|
| FIX-01 / P1 | Native direct cloud and local-to-cloud fallback checked permission before a blocking Keychain call. Settings changes, cancellation, or administrator policy revocation during that call could still allow dispatch using the previous configuration. | Shared `Host.request_active` checks policy, configuration identity, cancellation and applicable account/session before dispatch and after completion. Native local results are checked after inference as well. Tests reproduce settings/policy changes during credential reads, direct cancellation, and result withholding after policy changes. `service/host.py:86`, `service/assistant.py:42`. A request already transmitted cannot be recalled; the post-call check withholds its result. |
| FIX-02 / P2 | Graph DOCX retrieval parsed `word/document.xml` using raw ElementTree before the shared package/XML inspection. It also included field instruction text that the normal Word reader omitted. | Reuse `inspect_docx` once for text and sensitivity metadata, before exposing the result, and include coverage limitations. Tests verify DOCTYPE rejection before parsing and consistent visible text. `service/connectors.py:227`. The old path eventually checked labels; this was not a demonstrated label-release bypass. |
| FIX-03 / P2 | An existing `settings.tmp` symlink could cause the predictable temporary writer to truncate another file accessible to the service user. | Exclusive random temporary files, flush/fsync, atomic replacement and cleanup on failure. Tests preserve the symlink target and original settings when serialization fails. `service/host.py:11`. This addresses the file-write defect, not a complete defense against a compromised same-user process. |
| FIX-04 / P2 | Installer update backups followed an existing `setup-history` symlink outside the installation directory. | Reject unsafe backup folders before replacing source, recheck before backup creation, and create unique backup directories. A regression verifies that both the installed file and outside folder remain unchanged. `setup/launch.py:28`. Concurrent hostile changes to parent directories remain part of the broader same-user trust limitation. |
| FIX-05 / P2 | The native Unix listener created an unbounded thread per connection, including before authentication completed. | Both listeners use a shared 16-worker cap; overflow connections close and slots are released on exceptions. A real temporary Unix-socket test checks rejection with a reduced two-worker test limit. `service/host.py:465`. This is a concurrency cap, not comprehensive DoS protection. |

The first seven regression methods failed against the old implementation; after correction they pass. Four additional methods cover post-response revocation, local-result revocation, failed-write cleanup and native connection limits. Eleven review regression methods are included in the complete 348-test Python run.

## Open production blockers, in priority order

### SEC-01 — P1: privileged command-line helpers lack caller authorization

`macos/App.swift:7` allows the executable's credential helper to read a Keychain item and return it on stdout. `macos/WorkspaceCrypto.swift:29` accepts a decryption request without authenticating the caller or checking the current Microsoft account/managed policy. Any process able to launch the trusted executable under that OS user can request these operations, subject to the current Keychain lock/access behavior. Account-bound authenticated encryption protects ciphertext integrity; it does not authenticate who invokes this helper. No actual stored key was read to verify this finding.

**Required:** replace the general credential/decryption command interface with an authenticated broker using signed caller identity and operation-specific authorization. Keep secrets inside the trusted boundary, bind decryption to current account/policy, and test an unrelated same-user process against every helper entry point. The existing automation helper has a separate one-use service ticket; do not remove that control. Owner: endpoint/security engineering. Acceptance: unauthorized helper invocation fails before Keychain access; normal UI/service operations, account changes and locked Keychain pass regression tests.

### SEC-02 — P1: public declarations are not authoritative classification or DLP

`core/src/main.rs:5` explicitly returns `PUBLIC_USER_DECLARED` and `production_policy:false`. `service/documents.py:51` permits sensitivity metadata of `None` as legacy user-declared input. `service/managed_policy.py:37` permits development operation when no organization policy exists. A checkbox or editable source metadata cannot prove that mailbox, file, screen, or browser content is public. Current restrictions do not implement a mandatory CUI policy engine.

**Required:** mandatory managed enrollment for production; an explicit supported-data boundary; administrator-controlled classification and destination rules; unknown-data rejection; permission/label checks throughout retrieval, cloud dispatch, persistence, export and send. Bind approvals to data, destination, account and policy revision, with a documented revocation contract. Owner: security/product engineering and customer information owner. Acceptance: adversarial missing, forged, conflicting and revoked label cases cannot release protected data. Do not simply turn off the public-data guard to enable government use.

### SEC-03 — P1: label detection does not provide a protected-document lifecycle

The code reads MSIP headers and DOCX metadata and blocks indicated encryption or unmapped labels. It does not authenticate all metadata, enforce MIP use rights, protect generated files, propagate required labels, or evaluate recipients' rights. `service/documents.py:93` creates ordinary unlabeled DOCX files. `web/word-host.js:20` checks body/URL/selection before insertion, but a label-only change after inspection does not invalidate that snapshot. Source text and URLs alone are not a durable document identity or permission proof.

**Required:** supported rights-aware label integration, fresh metadata/rights checks before mutation and export, label propagation/protection for derived content, and tenant-tested negative cases. Keep protected documents unsupported until complete. Owner: Office integration/security engineering. Microsoft's [MIP SDK overview](https://learn.microsoft.com/en-us/information-protection/develop/overview) describes labeling and protection services; metadata parsing alone implements only part of that lifecycle.

### SEC-04 — P1: local trust boundary and release authenticity remain developmental

`service/host.py:480` authenticates the native peer using its executable path and the hash of the on-disk file. This is not verification of a signed running-code identity. The interpreter/service/runtime are installed in user-writable locations. The worker sandbox in `service/local_engine.py:7` denies network access but otherwise allows default filesystem access. A same-user compromise or altered local service is outside the effective enforcement boundary.

`tools/build.py:37` signs ad hoc and removes development staging quarantine metadata. Installer/source checksums verify consistency with adjacent manifests; they do not establish an independently trusted publisher or prevent release rollback. Installation backs up the previous app but lacks an automatic transaction rollback on a failed copy/signature check. Current tooling is suitable for development, not a managed government software supply chain.

**Required:** trusted publisher signing/notarization where applicable, hardened runtime and signed caller requirements, least-privilege service/worker isolation, administrator-controlled installed code, signed release metadata/update verification, rollback protection, validated install rollback, SBOM and provenance. Owner: release/endpoint engineering. Acceptance: modified code, wrong signer, old release and interrupted update fail safely on a clean managed endpoint.

### SEC-05 — P1 for protected data: plaintext runtime residue and incomplete retention

`service/local_engine.py:25` writes prompts, sources and generated output into the private run directory. Normal `finally` cleanup removes the directory, but forced process termination or power loss can leave plaintext. Saved task records retain observations/results without the seven-day expiry applied to ordinary Saved work. Source folders can be subject to OS backup/sync outside Onboard's control. AES-GCM saved-work encryption does not cover these temporary artifacts or solve SEC-01.

**Required:** design the full data inventory and approved storage location; minimize/encrypt spill files, crash-safe cleanup, administrator retention, task purge, backup exclusions and incident preservation rules. Owner: endpoint/security operations. Acceptance: crash, restart, disk-full, sign-out, account revocation and backup tests demonstrate the documented disposition of every content-bearing artifact. File deletion is not a guarantee of physical erasure from SSDs or backups.

### SEC-06 — P1: browser/desktop automation is a reviewed input mechanism, not a business-action policy engine

`service/automation.py:88` permits individually reviewed Return/click actions and checks observed browser domains. A click can navigate or submit information before the subsequent destination observation rejects an unexpected page. Application bundle IDs are allowlists, not publisher identity verification. General UI input cannot reliably distinguish a harmless button from a tenant-admin change, purchase or send. The current approval dialog truthfully warns that an action may submit information.

**Required:** restrict production controllers to approved task classes; use typed API actions for privileged administration; separately approve recipients, changed objects and irreversible effects; enforce browser navigation/egress in a managed browser or network layer before transmission. Retain one-use tickets, observation binding and manual uncertain-action recovery. Owner: agent/security engineering. Acceptance: malicious page text, stale UI, redirected navigation, secure fields and unexpected submit controls cannot exceed the user's approved business action. Keep privileged Entra/license tasks out of production GUI automation until this is proven.

### DEP-01 — P1 for government: cloud-specific deployment is incomplete

Graph has separate authorities and endpoints for commercial/GCC, GCC High and DoD (`service/tenant.py:5`). The Teams action handler explicitly accepts only commercial configuration and commercial Bot Framework trust endpoints (`teams-actions/src/handler.mjs:4` and `:29`). These facts are compatible: sovereign Graph support does not make the bot sovereign-ready. Automatic tenant discovery starts at the worldwide authority; hosted Office/Teams SDKs and browser search also add external destinations requiring review. Teams message text is passed in a URL fragment (`handler.mjs:81`); fragments avoid ordinary HTTP path logging but still exist in the client/deep-link handling surface.

**Required:** separate tested deployment profiles and registrations, correct bot trust configuration, supported API/Office capability matrix, approved hosting/DNS/TLS/CDNs, explicit outbound destinations and tenant policy. Replace content-bearing action URLs with an authenticated bounded handoff or formally accept the client-exposure risk. Validate the customer's actual GenAI endpoint, authentication/session renewal and data authorization. A military brand or hostname is not sufficient evidence. Owner: cloud/integration engineering with customer tenant administrators. Microsoft documents [national cloud differences and per-API availability](https://learn.microsoft.com/en-us/graph/deployments).

### OPS-01 — P1: audit, monitoring and response are not a production control set

Content-free message receipts and local diagnostic summaries are useful, but not a centralized, access-controlled audit trail for sign-in, policy revisions, denied access, data releases, tool approvals and actions. Local policy/configuration/runtime files do not provide fleet enrollment, reliable revocation, tamper-evident audit or a support/incident process. The hosting `/healthz` endpoint checks liveness, not configured bot readiness.

**Required:** a documented event schema with no prompt/key bodies, retention and SIEM integration; alerting, incident response, vulnerability handling, fleet policy distribution, and ownership/on-call procedures. Monitor approved endpoints without silently sending diagnostics to unapproved services. Owner: operations/security. Acceptance: demonstrate incident reconstruction from an approved action to account, policy, destination and outcome without leaking content.

### OPS-02 — P2, release-blocking: resilience and package validation gaps

The local TLS certificate is generated for 30 days when missing, without a managed renewal workflow (`service/host.py`, `serve`). TLS handshakes occur serially before worker admission. Shutdown waits indefinitely for unfinished queue work if the supervisor fails to finish. Production timeout, crash recovery, partial-install rollback, disk-pressure and concurrency testing is incomplete. The hosted handler bounds metadata only after reading it into memory and caches keys for five minutes without an unknown-key refresh path; availability testing should include oversized metadata and key rotation.

This review's native compile and staged ad-hoc signature verification passed. The copy under the workspace build directory failed signature verification with **resource fork / Finder information** diagnostics; `build-result.json` records `deliveredSignatureVerified:false`. The installer verifies the staged source separately, but the workspace copy must not be represented as a verified distributable. No installer was run. Owner: release/runtime engineering. Acceptance: verify the exact delivered/extracted artifact, certificate renewal, bounded failure recovery, load shedding and update rollback on a second managed Mac.

### VAL-01 — P1 release gate: live acceptance and independent assurance are outstanding

Unit tests do not prove a functioning GCC High/DoD customer workflow. Missing evidence includes actual Office hosts and CAC/Conditional Access, account/consent revocation, protected-label behavior, live GenAI protocol/renewal, source completeness/summary quality, browser and AX actions on supported applications, second-Mac installation, accessibility/keyboard operation, sustained load and independent penetration testing. Exact quote validation checks source spans, not relevance, entailment, completeness or absence of prompt injection; document drafts explicitly retain unverified claims.

Owner: QA, security assessor and tenant administrators. Acceptance: record supported OS/Office/cloud/provider versions, authorized real-data scenarios and negative tests, with customer sign-off. Windows and Intel Mac qualification remain outside the tested platform scope.

## Readiness across the three targets

| Area | Commercial M365 public-data pilot | GCC High | DoD / protected government workload |
|---|---|---|---|
| Current decision | Development testing only; close SEC-01 and release gates before wider pilot | Not production ready | Not production ready; no CUI/FCI mode |
| Identity | Browser PKCE/device code implemented; actual host SSO/CA acceptance still required | Separate government registration and actual CAC/CA tests | Correct DoD tenant/Graph resource and customer CAC/CA acceptance |
| Teams action hosting | Commercial handler implemented; deployment and package acceptance required | Government bot authentication and approved hosting incomplete | DoD-supported hosting/bot/API profile and boundary approval incomplete |
| Data controls | User-declared PUBLIC only | Same public-data restriction; tenant type does not change it | Authoritative classification, rights, protected outputs and approved egress required |
| Cryptography | AES-GCM/TLS mechanisms present; helper boundary and release issues remain | Map actual OS/runtime modules and approved modes to requirements | Validated module/configuration evidence where required; not established by this review |
| Assurance | Security review, release pipeline and pilot acceptance | Customer security baseline and authorization evidence | Applicable customer RMF/ATO and/or contractor contractual controls; scope must be determined |

Government use is not a single product certification. The customer information owner/authorizing authority must define data types, users, endpoint ownership, hosting, connected services and the authorization boundary. For contractor systems, determine the actual FAR/DFARS clauses and required CMMC assessment scope; for federal/DoD-operated systems, determine the applicable RMF baseline and authorization process. This review is an engineering gap assessment, not a determination that a particular contract applies.

Where [DFARS 252.204-7012](https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.?searchTerms=252.204-7012) applies, using an external cloud provider for covered defense information introduces cloud-security and incident obligations. The [DoD equivalency memorandum](https://dodcio.defense.gov/Portals/0/Documents/Library/FEDRAMP-EquivalencyCloudServiceProviders.pdf) explains FedRAMP Moderate equivalency evidence. A compliant underlying cloud service does not complete Onboard's application or customer-system authorization.

The [official CMMC overview](https://dodcio.defense.gov/Portals/0/Documents/CMMC/CMMC-101-202509.pdf) describes Level 2 as 110 requirements aligned with NIST SP 800-171 Rev. 2. Do not silently substitute a different revision or infer a CMMC level from “DoD” alone. The [NIST CMVP guidance](https://csrc.nist.gov/Projects/cryptographic-module-validation-program/FAQs) distinguishes using cryptographic algorithms from validating a module: retain evidence for the exact module, version, environment and approved mode. No FIPS validation claim was established for this application's current combination of CryptoKit, Python/OpenSSL and platform services.

Suggested control-family evidence mapping, subject to the selected baseline: access control/identification → SEC-01/02/03; system protection/integrity → SEC-04/06 and DEP-01; media protection → SEC-05; audit/accountability and incident response → OPS-01; configuration, maintenance and assessment → OPS-02/VAL-01. This is a gap map, not a completed control assessment. Use [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) to organize repeatable secure development, release protection and vulnerability response.

## Validation results

| Check | Observed result |
|---|---|
| Python suite | 348 passed, including 11 new review regression methods |
| Add-in JavaScript suite | 75 passed |
| Teams handler/server suite | 9 passed |
| Rust policy tests | 4 passed during the build |
| Native encryption checks | Round-trip, account-context substitution, ciphertext tampering and wrong-key rejection passed; no Keychain accessed |
| Native compilation | Passed; staged ad-hoc signature verified; workspace copy signature failed as documented above |
| Dependency advisory snapshot | OSV query completed for 59 distinct ecosystem/name/version combinations from four locks; zero advisory matches at query time |
| Source credential-pattern scan | 394 files inventoried; zero matches for four recognizable private-key/OpenAI/GitHub/AWS patterns |
| Live customer/tenant/model tests | Not performed in this review |

The dependency inventory is not a complete SBOM: it excludes OS libraries, runtime distributions, remote Office SDK code, model artifacts and vendored components. Zero matches does not prove safe, published, supported or uncompromised packages. Preserve the hashes/provenance already present, add full license/security attestation and transitive/platform coverage, and scan continuously. The credential scan does not cover entropy-based secrets, repository history, binaries or cloud configuration; it does not justify a claim that no secret has ever been committed.

## Completion plan and release gates

1. **Close the local security boundary first:** authenticated credential/decryption broker; signed immutable installation; protected service/worker boundary. Re-run hostile same-user invocation tests without exposing real keys.
2. **Create a reproducible commercial pilot release:** signed/verifiable output, transactional installer, certificate lifecycle, bounded recovery, dependency/SBOM/license checks and an automated test pipeline. Keep data PUBLIC and controllers narrowly scoped.
3. **Complete information protection:** mandatory managed policy, rights-aware labels, safe derived documents, crash-safe content retention and auditable reviewed sends/tool actions. These are prerequisites for protected data, not optional UI improvements.
4. **Qualify each sovereign deployment separately:** government registrations, bot authority, approved services/endpoints, CAC/CA, customer GenAI and the exact Office/API support matrix. No fallback to commercial services to bypass a government limitation.
5. **Obtain operational and authorization evidence:** live authorized acceptance, independent security assessment, security plan/control evidence, incident/patch/update processes, and customer approval of the deployment boundary.

These fixes and review documents are local review work. They were not installed, deployed to Azure, uploaded to GitHub, or used to restart the signed-in application during this review. Existing approvals and live work were preserved. The patched source is not labeled a production release.
