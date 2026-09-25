# Development setup verification — September 24, 2026

A separate source extraction and installation folder on the existing development Mac was used; the original installed app and its account state were not replaced.

- Reassembled the pinned Python runtime from its verified publisher archive.
- Installed and verified all 34 pinned Python wheels and retained model files.
- Verified the pinned runtime identity and retained source checksums at the new path.
- Passed 10 real monitor lifecycle cycles and 40 real harmless worker-stop cases in the new user/path context, without loading the AI model.
- Passed four Rust tests, built the Swift app, and verified the staged and copied development signatures.
- Passed 58 Python tests including setup integrity, archive traversal/corruption rejection, routing, source/policy boundaries and network failures.
- Downloaded the real pinned model configuration from the publisher and verified its exact size and SHA-256.
- Verified the exported source archive against its full per-file inventory.

The large model/runtime assets were supplied from verified local cache during this validation, not all fetched from the network again. The source launcher's archive verification was checked separately. A second physical Mac, clean-cache download of every asset, that machine's final app installation and actual Microsoft 365/add-in/cloud workflows remain unverified. Existing local generation/weather evidence belongs to the original app installation; it is not claimed as a model run on the new setup path.

## Prerequisite bootstrap update

`Setup.command` now starts with macOS built-ins, opens Apple’s developer-tools installer when required, and waits for the user to complete that installation. The Python launcher finds an existing Rust install even when its bin folder is missing from PATH; otherwise it installs official Rust stable with the minimal profile and makes it available to the same setup process. Explicit/manual proxy configuration carries through to Rust and Cargo; automatic proxy configuration requires an explicit approved proxy.

Shell syntax and the non-mutating plan path passed. Ten new tests cover existing Rust, failed or blocked downloads, installation arguments, post-install verification, proxy handling, HTTPS redirects, and the plan path. Rust network/subprocess operations in these tests are mocked; Apple dialogs and a fresh global Rust installation were not exercised on this development Mac. The earlier full application build verification above remains applicable to the unchanged app code.

## Python identity repair

The old installer regenerated an ad-hoc signature and required its bytes to match the development Mac’s result. The corrected setup copies the exact previously qualified Python executable and its license from the checked source archive, after verifying the original publisher executable. The original expected executable hash, runtime provenance, strict signature check and worker guards are unchanged. The new --cache-root option allows a fresh destination to reuse only checksum-verified downloads from a failed attempt. It does not reuse the earlier signed executable or qualification evidence.

Fresh-folder validation of the repair passed on the development Mac: exact Python identity, all 34 pinned wheels (5,555 installed wheel files), 10 monitor cycles, 40 harmless worker cases, four Rust tests, Swift build and development signature checks. All 58 Python tests passed, including five new cases for checked copy, corruption, signature failure and preservation of a mismatched existing executable. The initial agent-sandbox attempt failed during nested sandbox worker checks; a separate authorized run outside that sandbox completed successfully. Neither attempt replaced the installed app or loaded the AI model. The affected second Mac still needs to run the corrected installer.

## Browser selection and reuse-on-update

AI Settings now lists installed macOS web handlers, plus the system default, and offers DuckDuckGo/Google/Bing search. General searches and source links open in the saved browser; no Brave credential is requested. Browser pages are not automatically read into AI. Browser-side proxy errors remain visible in that browser. Weather stays a direct API lookup.

The setup launcher detects a managed existing installation and updates its source while preserving private state, assets, and local modifications. Replaced source/app files are backed up. The matching running app must quit before update and its service is stopped before code changes. A previous mismatched Python signing result is backed up and repaired using the exact pinned binary. Previous qualification records are archived before rerunning checks.

Validation: 69 Python tests, four Rust tests, Swift build, and browser helper tests passed. Real macOS browser discovery returned Safari and another registered web handler. A real update of the prior temporary installation reused all 46 verified downloadable assets and the existing Python package environment. Hashes and modification times of 16 model/runtime marker files remained unchanged. Fresh 10-cycle monitor and 40-case worker qualification and the app build completed; the delivered temporary app signature verified. No existing installed app was replaced during this test.

Native UI automation was unavailable, so selection-to-browser-launch acceptance has not been exercised through the UI. Browser helper checks verified query encoding, invalid URL/engine rejection and missing-browser failure without opening a browser. The other physical Mac and final installed-app update there remain to be verified.

## Visible service startup and readiness

Start service now runs off the UI thread, displays progress, waits up to 40 seconds for authenticated readiness, and reports startup failure in AI Settings and the status area. Starting a responsive existing service is idempotent. The host starts serving native requests only after both listeners and TLS are initialized, and cleans up sockets when startup fails. Private diagnostics record safe startup error messages without request/account content.

The Swift build, four Rust tests and all 69 Python tests passed. Five real process checks passed in a separately signed disposable app copy using a separate loopback port and state: native startup/authenticated status, repeated start, occupied port with cleanup, invalid settings preserved, and invalid TLS reported. No model was loaded and the installed app was not modified. These checks verify the startup mechanism and diagnostics; the other Mac’s specific failure has not yet been diagnosed.

## Stop button and older-service recovery

Stop service now runs outside the UI thread, displays stopping/stopped/error feedback in AI Settings, and verifies shutdown. If authenticated IPC cannot reach an older host, a same-user process identity and signed app-bundle check allow targeted termination. PID start-time and argument checks guard against process replacement. A verified idle host that ignores SIGTERM receives SIGKILL after a grace period; hosts with active children are preserved for retry. Start recovers a verified older listener while preserving a responsive current service. A per-user, per-port lock serializes updated native app controls. The updater invokes the inventory-checked helper before replacing source when legacy IPC cannot stop the service.

Validation: 78 Python tests, four Rust tests, Swift compilation and development-signature verification passed. Nine real process scenarios passed in isolated signed app copies: startup, repeated start, an unrelated listener preserved by both Start and Stop, legacy-copy Stop, repeated Stop, replacement during Start, an idle legacy host that ignores SIGTERM, invalid settings preserved, and invalid TLS reported. The legacy fixture came from the previous source release. No AI models were loaded, and the original installed app was not changed. Installer helper tests cover inventory rejection, shutdown refusal, and isolated invocation. Native button automation and the other physical Mac remain unverified; native CLI checks invoke the same control methods as the buttons.

## Reinstallation after app deletion

The setup launcher now treats an absent app with no active installation service lock as a reinstall and continues without a stop command. Stale socket/lock files are preserved and do not count as an active service. A genuinely locked service after app deletion produces an explicit restart-and-retry instruction; a running UI still blocks code replacement. This avoids requiring app-bundle verification when there is no service to stop.

All 82 Python tests passed. Four new regression cases cover absent app/no service, stale files preserved, an actual held macOS file lock, and a deleted but still-running UI. Process discovery is mocked in these launcher tests; file-lock operations use real temporary files. No installed app, model or account state was changed. The native app and service code are unchanged from the prior nine real process checks. The owner reported the older-installation verification error after deleting the app, consistent with a surviving service whose bundle cannot be verified. Reinstall acceptance on that Mac remains pending.

## Portable service identity and read-only diagnostics

The service verifier no longer assumes the Apple interpreter has basename Python or is installed under one hard-coded Xcode location. It launches the trusted system Python in isolated mode and queries its kernel executable path, then compares that exact path with the running service. The initial sys.executable-based approach failed the real framework-launcher test and was replaced before publication. The process-exit race between BSD metadata and argv lookup is now rechecked with the kernel, avoiding a false refusal after a successful termination. Existing app signature, user ownership, deployment, argument and PID start-time checks remain. Verification errors identify the failing check.

Diagnose.command verifies the source ZIP and runs read-only service inspection without setup, downloads or signals. It reports process IDs, executable paths and verification reasons, not prompts, credentials or process environments. Local paths can include the macOS username.

Validation: 91 Python tests, four Rust tests, Swift build with verified staged development signature, and nine real service scenarios passed. The diagnostic was exercised both directly and through the exported Diagnose.command against the existing service without stopping it. No models were loaded or installed app changed. The owner supplied an Apple Python launcher path from the affected Mac; the actual failed verification check there remains to be identified with the diagnostic. Passing local tests does not establish resolution on that Mac.

## Recovery after deployment state changes

A signed app can be updated in place while an older host continues using its previous state-folder argument. Verification now accepts that state mismatch only after all other bundle, interpreter, ownership and argument checks pass, and the target PID is corroborated as an opener of its original same-user service.lock while that file is actively locked. Missing, abandoned, symlinked or other-process locks do not establish recovery identity. Port mismatches still fail with a separate DEPLOYMENT_PORT_MISMATCH reason. No source or state files are rewritten by recovery.

Validation: 97 Python tests, four Rust tests, Swift build with verified staged signature, and 11 real service scenarios passed. Two added native scenarios start the legacy host, rewrite and sign the app deployment at the same path with a new state directory, then exercise Stop and Start respectively. Both stop the old PID and preserve the old settings marker. Negative tests cover absent lock proof, invalid app signature, abandoned lock files, another PID, and symlink locks. No models were loaded or original installed app modified. The owner reported DEPLOYMENT_MISMATCH; the state-change mechanism has been reproduced locally, while acceptance on the affected Mac remains pending.

## Outlook HTTPS and Teams manifest correction

Teams 0.2.0 had two official v1.17 schema violations: unsupported packageName and incorrect groupchat casing in configurableTabs.scopes. Version 0.2.1 removes that property, uses groupChat and deduplicates validDomains. The entire manifest passes Microsoft's downloaded v1.17 JSON Schema with jsonschema 4.23.0; ZIP root members and 192px color/32px outline PNG dimensions also passed. Source schema URL: https://developer.microsoft.com/en-us/json-schemas/teams/v1.17/MicrosoftTeams.schema.json. No Teams client upload success or live Teams workflow is claimed.

On the development Mac, the user explicitly approved trusting the exact live Onboard development certificate for SSL with policy string localhost in the user Keychain. Live and saved certificate fingerprints matched. The native macOS URLSession then validated HTTPS and returned HTTP 200 for outlook.html. The command-line curl check still failed and was not used as acceptance evidence; native platform verification passed. The trust change is specific to this Mac and is not included in the release. Outlook add-in UI acceptance remains to be confirmed after reopening the add-in.

## Automatic tenant detection and Teams readiness — 2026-09-25

The updated native app built and passed ad-hoc signature verification, with four Rust tests passing. All 116 Python tests and eight JavaScript SDK lifecycle tests passed. These include control fixtures for Commercial/GCC/GCC High/DoD routing, mismatched issuer/tenant/endpoint rejection, unknown government subtype rejection, cancellation, proxy failure without cross-cloud retry, and Teams initialization failure/timeout/configuration handling. Test fixtures contain no fabricated enterprise content.

A real read-only request using the product transport to Microsoft's public tenant OpenID metadata selected Commercial and graph.microsoft.com. No credentials were sent, no user signed in, and this does not establish live DoD/GCC High acceptance.

Teams package 0.2.2 passes Microsoft's v1.17 schema. Installed teams.html, teams-host.js and app.js each returned HTTP 200 through native macOS URLSession with normal certificate validation; served headers include both teams.microsoft.com and its subdomains. Reloading the actual Teams client still produced chrome-error://chromewebdata rather than the Onboard page. The exact browser error code was not available. Therefore live Teams loading is unresolved, and Teams-supported HTTPS remains a deployment concern. No certificate validation was disabled.

The app was updated on the development Mac, preserving the prior app, local runtime, model and settings. Automatic tenant detection is implemented; host SSO and live organizational data acceptance are not.

## Microsoft device verification address correction — 2026-09-25

The owner's configured commercial Entra app returned `https://login.microsoft.com/device`, which the old allowlist rejected. A real device-code start reproduced the failure; after the correction, the same live response passed validation. Codes and tokens were not logged or saved, and no sign-in was completed. The added address is limited to the exact HTTPS device page for the commercial authority (including GCC); government routing and token destinations are unchanged. Malformed URLs, credentials in URLs, unexpected ports, spoofed hosts and other paths on the newly allowed host are rejected. All 121 Python tests and four Rust build tests passed. The updated app was installed on the development Mac.

## Outlook Connect initialization correction — 2026-09-25

Actual Outlook for Mac showed “Connecting to the application” indefinitely with Connect disabled. Startup diagnostics identified a script-src-elem block for ajax.aspnetcdn.com. Microsoft's current Office.js and outlook-mac-16.00.js both request the exact HTTPS /ajax/3.5/MicrosoftAjax.js dependency. The CSP now allows only that file, only on the Outlook page; Teams policy and API origin checks are unchanged. No unsafe-inline or unsafe-eval directive was added.

After installing and restarting the service, reloading the actual Outlook add-in produced “Outlook is ready. Enter your local connection code to connect Onboard.” The native accessibility tree showed Connect enabled. This verifies the host initialization/button fix; a fresh Microsoft sign-in and pairing code are required after the restart, and no message was submitted to AI during verification.

All 123 Python tests, 15 JavaScript initialization tests and four Rust build tests pass. Missing Office libraries, initialization timeout, wrong host and missing mailbox identity remain explicit failures. Pairing no longer requires a selected message, but including an opened item still checks item availability.

## 2026-09-25 — Outlook context and local-to-cloud routing

- 150 Python control tests, 15 JavaScript initialization/control tests, and four Rust policy tests passed; Swift app built and the staged/installed development signature verified.
- Actual offline local generation on public installation documentation completed with 1,086 prompt tokens, a 2,048 total ceiling, and 512 output ceiling. Returned source quotes passed exact-span validation. No mailbox content was used. This is a single-request check, not sustained-load or full Outlook quality acceptance.
- Removed only the fixed 5 GiB admission gate at owner direction. Existing live protected-reserve, pressure, swap, thermal, lifecycle and worker-footprint guards remain.
- Added actual Graph related-message search, tokenizer-sized complete excerpts, local selection/citation checks, settings and per-request cloud controls, bounded cloud payload and daily quota, cancellation/account/session rechecks, and source-visible failure behavior. Boundary tests use clearly labeled test fixtures and do not represent live cloud or mailbox acceptance.
- A real configured-provider check using public documentation returned HTTP 503, including after correcting full endpoint URL handling. No successful cloud answer or credential acceptance is claimed.
- Distribution excludes settings, credentials, certificates, private prompts, mailbox data, local run evidence and model weights.

## 2026-09-25 — Teams parity and connection lifetime

157 Python tests, 17 JavaScript tests and four Rust tests passed. New control tests cover delayed pairing/session use after simulated elapsed days for Outlook and Teams, single-use codes, replacement and explicit invalidation, Microsoft authorization, origin binding, replay rejection, and shared local/cloud-stage routing for mail, Teams chat and channel requests. The app built, its development signature verified, and the updated service installed and started.

No mailbox or provider response was fabricated. These controls are not a claim of live Teams host acceptance or successful cloud-provider connectivity. Existing Teams HTTPS deployment and live integration acceptance limitations remain. The update does not alter Microsoft token expiration or organization policy.


## 2026-09-25 — Source recovery and reviewed cross-app messages

- 182 Python tests, 25 JavaScript tests and four Rust tests passed. The Swift app built; staged and installed development signatures verified. The updated service is running with the retained local runtime ready.
- Real offline generation on published installation documentation completed with 1,105 input tokens. Its returned quotations passed exact source-span validation. This was public documentation, not a mailbox test or evidence of universal answer quality.
- Formatting controls cover complete Markdown-wrapped JSON, original/alias ID mapping and whitespace-only restoration. Changed facts, unseen quotes, unknown references, wrong field types and incomplete JSON remain rejected. Failed local output falls back to clearly labeled copied excerpts, with one optional permitted cloud analysis attempt.
- Reviewed-message controls cover recipient resolution, no write during preparation/review, explicit Send, exact reviewed payload, one attempt per review, account/session isolation, replaced reviews, missing permission, unknown delivery without retry, content-free write-ahead receipts and correct government Graph endpoint selection.
- Calendar controls cover partial/malformed responses, busy/tentative/unknown/all-day events, free/cancelled entries, weekdays, past times, daylight-saving offsets and changed availability before sending. All are controlled fixtures, not live calendar acceptance.
- Optional Mail.Send and Teams Chat.Create/ChatMessage.Send/User.ReadBasic.All scopes are disabled by default and require owner/admin consent as applicable. The model never chooses recipients or dispatches sends. Email acceptance is not proof of delivery; uncertain sends require checking Sent Items or Teams.
- No real messages were sent. Graph was disconnected following service replacement. End-to-end mail, Teams and calendar sending remains pending configured permissions, sign-in and user review. Browser-only visual preview was blocked by that browser’s certificate trust; no certificate validation was bypassed. Existing Teams host/HTTPS deployment limitations still apply.
- Release excludes local settings, credentials, certificates, mailbox data, run evidence, receipts and model weights.


## 2026-09-25 — Reply context and reference contract correction

- Reproduced the broad-search cause in controls: a legacy search=true flag on Suggest a reply could mix in unrelated messages. Reply/edit tasks now retrieve only explicitly selected messages, skip implicit thread expansion and require a new explicit-search flag before adding mailbox candidates. No selected source means no invented reply. UI defaults and task changes clear the search checkbox. Explicit search uses AND terms and excludes generic reply instructions.
- Mail context filtering keeps exact contiguous source spans, omits standard footer/URL-only blocks and splits around long tracking URLs. Questions explicitly about links/footers preserve those inputs. Filtering is marked partial; original text remains reviewable. Locally filtered text is not replaced with raw tracking-heavy content during cloud handoff. Model text and sources cannot trigger link navigation or sending.
- Numbered evidence references replace brittle model-retyped quotations. Exact source text is attached by the service and checked against the retrieved original. Supplied source aliases resolve only when unambiguous. Unknown IDs, conflicting fields and malformed/incomplete answers still fail. Duplicate JSON fields and known placeholder answers are rejected. One observed premature structural brace can be removed without changing any field value.
- Public-document live testing exposed direct-quotation mismatch, copied prompt placeholders, alias confusion, an invented extra reference and a misplaced brace; these findings were not counted as passing quality results. One run also stopped under the retained runtime guard. The final captured actual local response used 1,285 prompt tokens and generated: “Thank you for the installation instructions. I have not installed the app yet.” Replaying that unchanged response through the corrected parser/reference validator passed with one exact evidence reference. This was public documentation, not customer email, and not a claim of universal model quality.
- 202 Python tests, 27 JavaScript tests and four Rust tests passed. Staged and installed development signatures verified. No real email, Teams message, private mailbox data or tracking links were used in model tests or sent during this work. Live Outlook reply acceptance still requires the owner to open the intended email and retry.


## Native approval and reply display update — September 25, 2026

- 211 Python, 31 JavaScript and four Rust control tests passed.
- SwiftUI build and ad-hoc signature verification passed; installed development service started.
- Pending connection alone grants no session. Mismatched accounts, wrong origin/secret, replay, account changes, decline, cancellation and invalidation are tested. Requests are bounded; abandoned approval requests expire after ten minutes while established sessions have no time-based Onboard expiry.
- Code-free connect controls share the same implementation in Outlook and Teams. Legacy code fallback remains under Advanced.
- Reply display separates editable text from expandable original evidence. Explicit no-reply notices return deterministic advice without model/cloud execution or enabling message review. Conversational drafts no longer request meetings implicitly.
- Tests use declared control fixtures, not fabricated live mailbox data. This update does not claim Microsoft host SSO, live in-host approval acceptance or successful model analysis of the user's specific notice. No user email body, ID or account data is included in these artifacts.
