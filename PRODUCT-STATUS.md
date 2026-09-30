# Onboard AI — product priorities and release status

September 30, 2026 · native/service **0.7.3**, add-in packages **0.6.1**.

Native/service 0.7.3 is installed and verified on the development Mac, including the Activity interface and a real local model request. Matching source and installer files are prepared for distribution. Azure and the Teams catalog have not been updated by this release operation. See [RELEASE-0.7.3.md](RELEASE-0.7.3.md) for deployment boundaries and validation.

The [production/security review](PRODUCTION-READINESS-REVIEW.md) covers commercial M365, GCC High and DoD. [0.7.3 hardening](HARDENING-0.7.3.md) adds encrypted model scratch storage, worker isolation, central audit and signed-update paths, managed browser restrictions and Activity diagnostics. Protected-document lifecycle, trusted distribution, customer operations and live acceptance remain production gates.

Earlier releases introduced saved offline tasks, optional cloud planning/repair and reviewed desktop/browser controllers ([setup and limits](TASK-CONTROLLERS.md)), plus experimental TurboQuant cache compression and bounded cloud assistance ([compression and offloading](TURBOQUANT.md)). Broader controller workflows and installation on the second Mac still require live acceptance. Historical Sprint 0–3 research and build-time notes describe their dates; they do not establish current deployment or customer verification.

## Intended product

Application-first assistance in Outlook, Teams and Word; one local Onboard service; optional approved cloud reasoning; Graph supplies additional permitted context. The user reviews outgoing text, recipients and attachments, and sends explicitly. Real connected information only. The local model is an optional bounded extraction/writing tool; deterministic application code performs authorized actions. Model instructions never grant permissions.

## Priority order

| Priority | Deliverable | Current state / completion evidence |
|---|---|---|
| P0 | Preserve reviewed work across applications and restarts | 0.6 adds explicit encrypted Saved work in native, Outlook, Teams and Word. Account/cloud separation, seven-day expiry, deletion, source references and review reset are implemented. Original source bodies and active tool execution are not persisted. |
| P0 | Prevent losing drafts when destination apps fail | Two-phase local handoff reserves a draft and removes it only after the host reports success. Host failure preserves text. An ambiguous interrupted opening requires checking the destination; it is never automatically resent. |
| P0 | Consistent connection/capability status | Authenticated add-in diagnostics distinguish a running service, signed-in account, qualified model, configured provider and unverified live acceptance. Installed local service uses 0.7.3; prepared add-in packages use 0.6.1. The Teams catalog was last verified at 0.6.0. |
| P0 | Current, truthful documentation | This file is authoritative. Historical baseline and earlier directions are marked accordingly. No mock or unit test is reported as live tenant validation. |
| P1 | Administrator-controlled restrictions | Optional root-owned endpoint policy restricts tenant/provider selection, public label mappings, cloud, hybrid tasks and saved work. This is an MDM-deployable restriction file, not the complete signed central management plane. |
| P1 | Complete real workflow acceptance | Prepared test procedure below. Actual Outlook→Word→Outlook and Teams handoffs, protected tenant labels, second-machine deployment and GenAI.mil are pending live acceptance. |
| P1 | Simple identity and deployment | Native approval remains. 0.6.2 adds selected-browser PKCE sign-in, allowing tenant-provided CAC authentication; live CAC acceptance and host SSO, managed certificate deployment, trusted publisher signing/notarization and a binary customer installer remain open. |
| P1 | Government target deployment | Commercial testing only. Cloud-specific bot profiles exist; authorities, distribution and the actual customer GenAI contract still require validation against the selected target. A provider name does not authorize protected-data processing. |
| P2 | Richer knowledge collection | Bounded Graph collection exists. Thread/attachment completeness, permission-aware indexing, source revalidation and better relevance evaluation remain open. Saved drafts are not a cache of continuing source access authority. |
| P1 production gate | Full protected-document lifecycle | Metadata detection exists. Rights-aware MIP integration, output-label/protection application and recipient rights evaluation remain open. No CUI/FCI mode enabled. |
| P2 | Broader agents and recovery | 0.7.0 implements reviewed macOS/browser controls and encrypted task checkpoints with explicit interrupted-action resolution. Native UI acceptance remains pending; screenshot/DOM controllers and action rollback remain open. See TASK-CONTROLLERS.md. |
| P3 | Advanced application features | Word tracked edits/comments/template preservation; conversational Teams bot and transcript/action workflow; reviewed calendar scheduling; PDF/OCR then Excel/PowerPoint. Prioritize against the pilot user's actual tasks. |
| P1 production gate | Fleet operation | Central mTLS audit tooling, signed-update verification and Activity diagnostics are implemented. Approved collector hosting, signing/notarization, enrollment, policy signatures/revocation and managed rollout remain open. Windows runtime qualification is a separate platform gate. |

## What 0.6 saves

Only explicitly reviewed PUBLIC drafts, their title, bounded source references and coverage notes are saved. Content uses AES-256-GCM with the stable cloud authority/tenant/account scope as authenticated data; its random key lives in the current Mac user's Keychain (`WhenUnlockedThisDeviceOnly`). Storage is bounded to twenty drafts and 3 MB per account, in private local files. It is not synchronized or backed up by Onboard. Other software/OS backup behavior is outside this implementation.

Reauthentication to the same authority/tenant/account can reopen saved drafts. Different accounts and clouds cannot access them through the service. A saved draft grants no Graph permission, no sending permission and no permission to rerun a tool. New policy/label restrictions are checked before release. Missing keys or altered ciphertext fail without overwriting the stored file. Expired content is inaccessible and removed on the next successful access; this is not a claim of guaranteed physical erasure or seven-day backup deletion.

Restart/sign-out still clears sessions, raw inspected document snapshots, in-memory document files, active requests and unsaved handoffs. Save a reviewed draft explicitly to preserve it. Reopen it in Word, then create a new DOCX for the current Outlook compose session if needed. To insert a saved draft in Word, inspect the destination document **first**, then reopen the saved draft and review insertion. New files remain unlabeled PUBLIC drafts; protection is not copied.

## Pilot acceptance — permitted real data, user-controlled sending

1. Install on the chosen pilot endpoint; verify the service, model, certificate and actual Office host connections. Record OS/Office/add-in/service versions.
2. Open an authorized real public email. Summarize it, inspect its sources, then create documentation from an explicit relevant collection. Record omissions and whether facts/citations are correct.
3. Review the draft, give it a title, and save it. Stop/restart the local service, sign in again, and reconnect Word. Verify the saved draft appears only for the same account.
4. Inspect a public destination Word document, reopen the saved draft, review/edit and insert. Create the reviewed DOCX. In an Outlook compose pane refresh the document tray and attach it; inspect recipients, body and the actual attachment. Sending requires a user click in Outlook.
5. Transfer a reviewed draft between Outlook and Teams. Verify a failed host opening preserves it, and another pane cannot claim the same opening. Check that nothing was sent automatically.
6. Test an unknown label, encryption-bearing label, changed account, wrong provider policy, blocked proxy, locked Keychain and interrupted local service. Record visible failures; never loosen policy to make a test pass.
7. Run the documented customer GenAI endpoint with permitted input; verify protocol, authentication, model, JSON planning, latency, token limits and destination. A commercial-provider pass does not qualify GenAI.mil.

Report scenario completion, factual accuracy, omitted evidence, connection repairs, latency and user edits. Offline fixtures establish software behavior, not successful execution of these live scenarios.
