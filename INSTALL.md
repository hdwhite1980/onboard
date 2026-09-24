# Install Onboard AI on another Mac

This is a **development source installer** for **Apple-silicon Macs running macOS 26 or later**. It is not a signed/notarized customer installer. Windows and Intel Mac host installers are not available.

## Before you start

- Allow at least 6 GiB of free disk space. Pinned downloads total approximately 1.42 GB, including the Qwen3-1.7B model, Python distribution and Python packages. Rust build dependencies may require additional downloads.
- No separate Rust installation is needed. The script detects existing tools, opens Apple’s developer-tools installer if needed, and installs the official stable Rust toolchain with its minimal profile if Rust is missing or unusable. Rust is available to setup immediately; no Terminal restart is needed.
- If Apple’s installation dialog appears, complete it, then press Return in Terminal to continue. Apple may require administrator approval and acceptance of its terms. The script cannot approve those dialogs for you. An unavailable or cancelled installation stops setup safely.
- Build tools use the currently available official Apple tools and Rust stable release; model/runtime assets remain version-pinned. See [Apple’s installation instructions](https://developer.apple.com/library/archive/technotes/tn2339/_index.html) and [official Rust installation](https://rust-lang.org/tools/install/).
- Use a normal user account. Setup does not require `sudo`.

## Download and run

1. Open [hdwhite1980/onboard](https://github.com/hdwhite1980/onboard), choose **Code → Download ZIP**, and extract it. Keep `Onboard-Source.zip` inside that extracted folder; setup verifies and expands it itself.
2. Open Terminal in the extracted repository folder. To inspect the plan without downloading models or installing anything, run:

   ```sh
   bash Setup.command --plan
   ```

3. Run the development setup:

   ```sh
   bash Setup.command
   ```

   After preparing the prerequisites, it extracts checked source into `~/OnboardAI`, downloads exact pinned assets over HTTPS, verifies their sizes and SHA-256 hashes, installs packages offline from the verified wheel set, runs fresh harmless worker/monitor qualification, builds the app, and installs it in `~/Applications/Onboard AI.app`.

   An existing destination or installed Onboard app is not automatically overwritten. To build without installing, choose a fresh destination:

   ```sh
   bash Setup.command --destination "$HOME/OnboardAITest" --build-only
   ```

4. Keep the installation folder in place. The current development app depends on its runtime/model paths. Move neither the folder nor its contents after setup.
5. Open **Onboard AI** from your user's Applications folder. Start the service under **AI Settings**, enable permitted public local processing, and try a short public question with internet lookup off. Local generation still enforces the retained memory and 512-token total-context limits.

If macOS or organizational policy blocks the development app, follow the organization's approved development signing process. Do not disable Gatekeeper or certificate validation. A notarized distribution is separate work.

## Connections and add-ins

Configure GCC High/DoD, approved tenant/client IDs and Microsoft sign-in under **AI Settings → Microsoft 365**. Optional web search and GenAI credentials also go in Settings, not in repository files. Secrets are saved using Keychain. The current app has no commercial/GCC sign-in option.

The model remains on the Mac after setup. Local AI can run offline; web search, Microsoft 365 retrieval and cloud AI require their configured online connections.

Outlook uses `outlook.xml`; Teams uses `Onboard-Teams.zip`. These are development packages pointing to `https://localhost:38473`, meaning the same computer running the client. Installing the desktop app does not deploy the add-ins. Approved HTTPS certificate trust and tenant deployment remain required. In GCC High/DoD, ordinary Teams custom-app upload is unavailable; the administrator must establish the supported organization-specific distribution route. See [Microsoft's government capability matrix](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/cloud-overview).

## Proxy, failures and retry

Setup uses manual system proxy settings. PAC/WPAD is not executed; an approved explicit proxy can be supplied without credentials in its URL:

```sh
bash Setup.command --proxy http://approved-proxy.example:8080
```

A blocked or corrupt download stops setup. Verified files are retained; partial downloads are removed. Existing files with incorrect hashes are not overwritten. Setup does not silently select another model/version or bypass the proxy. The selected explicit/manual proxy is also passed to Rust and Cargo. Apple’s system installer uses macOS networking; organization-specific authentication or download restrictions may require IT assistance. No proxy credentials should be placed in command arguments.

If setup stops before worker qualification begins, you can retry from the created source folder with `python3 -B product/integrated/tools/setup_local.py setup --install`. If qualification evidence was already created, setup refuses to overwrite it: keep it for diagnosis and use a fresh destination for another explicit attempt.

## Verification and remaining limits

The setup was exercised in a fresh folder on the development Mac, using verified cached assets: Python/dependency installation, runtime identity verification, 10 monitor cycles, 40 harmless worker-stop checks, four Rust tests, Swift compilation and development signature verification passed. The original installed app was not replaced. A real pinned model configuration download was separately verified. The Python test suite includes source integrity and prerequisite-control tests. The Rust installation paths use mocked subprocess/network boundaries in those tests; they do not claim a new Rust installation occurred. `--plan` was also exercised without installing anything.

A second physical Mac, every publisher download from an empty cache, the final install step on that machine, and actual Outlook/Teams/Graph/cloud workflows still need validation. A passing setup build does not establish those results.
