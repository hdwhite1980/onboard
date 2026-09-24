# Development setup verification — September 24, 2026

A separate source extraction and installation folder on the existing development Mac was used; the original installed app and its account state were not replaced.

- Reassembled the pinned Python runtime from its verified publisher archive.
- Installed and verified all 34 pinned Python wheels and retained model files.
- Verified the pinned runtime identity and retained source checksums at the new path.
- Passed 10 real monitor lifecycle cycles and 40 real harmless worker-stop cases in the new user/path context, without loading the AI model.
- Passed four Rust tests, built the Swift app, and verified the staged and copied development signatures.
- Passed 53 Python tests including setup integrity, archive traversal/corruption rejection, routing, source/policy boundaries and network failures.
- Downloaded the real pinned model configuration from the publisher and verified its exact size and SHA-256.
- Verified the exported source archive against its full per-file inventory.

The large model/runtime assets were supplied from verified local cache during this validation, not all fetched from the network again. The source launcher's archive verification was checked separately. A second physical Mac, clean-cache download of every asset, that machine's final app installation and actual Microsoft 365/add-in/cloud workflows remain unverified. Existing local generation/weather evidence belongs to the original app installation; it is not claimed as a model run on the new setup path.

## Prerequisite bootstrap update

`Setup.command` now starts with macOS built-ins, opens Apple’s developer-tools installer when required, and waits for the user to complete that installation. The Python launcher finds an existing Rust install even when its bin folder is missing from PATH; otherwise it installs official Rust stable with the minimal profile and makes it available to the same setup process. Explicit/manual proxy configuration carries through to Rust and Cargo; automatic proxy configuration requires an explicit approved proxy.

Shell syntax and the non-mutating plan path passed. Ten new tests cover existing Rust, failed or blocked downloads, installation arguments, post-install verification, proxy handling, HTTPS redirects, and the plan path. Rust network/subprocess operations in these tests are mocked; Apple dialogs and a fresh global Rust installation were not exercised on this development Mac. The earlier full application build verification above remains applicable to the unchanged app code.
