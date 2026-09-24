# Onboard AI

Onboard AI combines a native macOS Ask AI dashboard, a shared local AI service, Outlook and Teams add-ins, and settings for Microsoft 365, public web search and optional GenAI API connections.

## Install on another Mac

Start with **[INSTALL.md](INSTALL.md)**. Download this repository using **Code → Download ZIP**, extract it, open Terminal in the extracted folder and run:

```sh
bash Setup.command --plan
bash Setup.command
```

The current setup is a **development source installer for Apple silicon on macOS 26 or later**, with one setup script that installs missing Apple developer tools and the official Rust toolchain. If Apple’s installation dialog opens, complete it and press Return in Terminal to continue. It downloads the exact Qwen3-1.7B model and runtime dependencies, verifies SHA-256 checksums, performs fresh local worker/monitor checks, builds the app and installs it for the current user. Approximately **1.42 GB** is downloaded, plus any missing Rust build dependencies. The model then stays on the Mac for offline local AI. This is not a notarized customer installer; Windows and Intel Mac builds are not provided.

The default installation folder is `~/OnboardAI`; keep it in place. Existing installs are not silently replaced. Connections and credentials are configured later in **AI Settings**. No account state or API keys are included in this repository.

## Application source

**[Onboard-Source.zip](Onboard-Source.zip)** contains the complete current integrated application source and supporting local AI code, organized using the original project paths:

- `product/integrated/macos/`: SwiftUI Ask AI and Settings dashboard.
- `product/integrated/service/`: shared service, Graph and GenAI adapters, web/weather lookup, policy routing and local model adapter.
- `product/integrated/core/` and `product/meeting_briefing/core/`: Rust policy and source validation.
- `product/integrated/local/` and `product/local_ai/`: retained local model worker, resource guards, lifecycle checks, supporting calibration source, dependency locks and notices.
- `product/integrated/web/`: Outlook and Teams interfaces.
- `product/integrated/tools/` and `setup/`: build, setup, installation and export tools.
- `SOURCE-INVENTORY.json`: per-file source checksums.

The source is provided as an archive to preserve its directory layout through browser upload. Model weights, installed environments, credentials, private service state and unrelated historical model downloads are excluded. `source-release.json` identifies the source archive and exact model version. The setup downloads assets directly from their pinned publishers; it does not choose a newer model automatically. Third-party notices are retained in the source archive.

## Outlook and Teams

- [outlook.xml](outlook.xml): Outlook add-in manifest.
- [Onboard-Teams.zip](Onboard-Teams.zip): Teams package; keep this ZIP intact.
- [Onboard-Web-Assets.zip](Onboard-Web-Assets.zip) and [web/](web/): interfaces and icons.
- [deployment-status.json](deployment-status.json): current add-in deployment status.

The add-ins currently use `https://localhost:38473`, the Onboard service on the same machine running the client. GitHub stores these files; it is not currently hosting their pages. Installing Onboard AI does not install the add-ins. HTTPS trust, approved tenant deployment and actual host integration tests remain required. See INSTALL.md for GCC High/DoD limitations.

## What has been verified

[SETUP-VERIFICATION.md](SETUP-VERIFICATION.md) records successful setup/build in a separate folder on the development Mac. A second physical Mac and actual Outlook/Teams/Graph/cloud acceptance remain pending. The current content policy permits only user-declared PUBLIC data; sensitive enterprise content is not enabled.
