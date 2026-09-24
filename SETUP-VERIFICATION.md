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
