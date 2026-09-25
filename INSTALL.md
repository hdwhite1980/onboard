# Install Onboard AI on another Mac

This is a **development source installer** for **Apple-silicon Macs running macOS 26 or later**. It is not a signed/notarized customer installer. Windows and Intel Mac host installers are not available.

## Before you start

- Allow at least 6 GiB of free disk space. The source ZIP includes the exact qualified Python executable and its license; the remaining pinned downloads total approximately 1.42 GB, including the Qwen3-1.7B model, Python distribution and Python packages. Rust build dependencies may require additional downloads.
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

   Setup detects an existing managed installation from the installed app, or an unfinished setup in `~/OnboardAI` / `~/OnboardAIFixed`. It updates that folder in place. A first installation uses `~/OnboardAI`. Existing model/download files are size/hash-verified and reused; an intact Python runtime and package environment are reused. Missing assets are downloaded. Setup then reruns harmless qualification, builds the app, and installs it in `~/Applications/Onboard AI.app`. Settings and Keychain credentials are preserved.

   Quit Onboard AI before updating; setup also checks and prompts if the matching app is still running. It stops the old background service before source changes. Changed managed source files and the previous app are backed up; locally edited source files are not silently overwritten. To build without replacing the installed app:

   ```sh
   bash Setup.command --destination "$HOME/OnboardAITest" --build-only
   ```

4. Keep the installation folder in place. The current development app depends on its runtime/model paths. Move neither the folder nor its contents after setup.
5. Open **Onboard AI** from your user's Applications folder. Start the service under **AI Settings**, enable permitted public local processing, and try a short public question with internet lookup off. Local generation still enforces the retained memory and 2,048-token total-context limit (up to 1,536 input and 512 output tokens).

If macOS or organizational policy blocks the development app, follow the organization's approved development signing process. Do not disable Gatekeeper or certificate validation. A notarized distribution is separate work.

## Connections and add-ins

Use Automatic tenant detection with approved tenant/client IDs and Microsoft sign-in under **AI Settings → Microsoft 365**. Choose an installed browser and search engine under **AI Settings → Internet access**, then save. General searches open in that browser and require no search API key. Browser pages are not automatically read back into Ask AI. Optional GenAI credentials go in Settings, not in repository files. Secrets are saved using Keychain. Automatic detection selects Commercial, GCC, GCC High or DoD from Microsoft metadata; explicit selections are also checked. Approved registrations and consent in the chosen cloud remain required.

The model remains on the Mac after setup. Local AI can run offline; web search, Microsoft 365 retrieval and cloud AI require their configured online connections.

Outlook uses `outlook.xml`; Teams uses `Onboard-Teams.zip`. These are development packages pointing to `https://localhost:38473`, meaning the same computer running the client. Installing the desktop app does not deploy the add-ins. Approved HTTPS certificate trust and tenant deployment remain required. In GCC High/DoD, ordinary Teams custom-app upload is unavailable; the administrator must establish the supported organization-specific distribution route. See [Microsoft's government capability matrix](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/cloud-overview).

## Proxy, failures and retry

Setup uses manual system proxy settings. PAC/WPAD is not executed; an approved explicit proxy can be supplied without credentials in its URL:

```sh
bash Setup.command --proxy http://approved-proxy.example:8080
```

A blocked or corrupt download stops setup. Verified files are retained; partial downloads are removed. Existing files with incorrect hashes are not overwritten. Setup does not silently select another model/version or bypass the proxy. The selected explicit/manual proxy is also passed to Rust and Cargo. Apple’s system installer uses macOS networking; organization-specific authentication or download restrictions may require IT assistance. No proxy credentials should be placed in command arguments.

For an update or retry, download the latest repository ZIP, extract it, quit Onboard AI, and run the same command:

```sh
bash Setup.command
```

You do not need a new installation folder. If the earlier setup used a custom folder and no app was installed yet, use `bash Setup.command --destination "/path/to/existing/Onboard"`. An optional `--cache-root` can reuse checked downloads from a different old folder.

The previous “Packaged Python identity did not match” failure is repaired by backing up the differing executable and copying the exact verified qualified executable. No new hash is enrolled. Other corrupt assets or locally modified source files produce a specific error instead of being trusted. Previous qualification evidence is archived under `product/integrated/evidence/setup-history` before fresh checks; changed source backups are in `setup-history`. Files in a managed source folder that were removed from the newer release are retained rather than deleted. The current updater needs at least 2 GiB free for staging, plus space for missing downloads. First-time setup should have at least 6 GiB free.

## Verification and remaining limits

The setup was exercised in a fresh folder on the development Mac, using verified cached assets: Python/dependency installation, runtime identity verification, 10 monitor cycles, 40 harmless worker-stop checks, four Rust tests, Swift compilation and development signature verification passed. The original installed app was not replaced. A real pinned model configuration download was separately verified. The Python test suite includes source integrity and prerequisite-control tests. The Rust installation paths use mocked subprocess/network boundaries in those tests; they do not claim a new Rust installation occurred. `--plan` was also exercised without installing anything.

A second physical Mac, every publisher download from an empty cache, the final install step on that machine, and actual Outlook/Teams/Graph/cloud workflows still need validation. A passing setup build does not establish those results.

## If Start service does not work

The app displays “Starting…” while it waits for an authenticated service response. Success changes to “Local service ready.” Failures appear in AI Settings and the status area, including missing Python/service files, a busy local address, invalid saved settings, and certificate problems. The service writes a private startup diagnostic to `product/integrated/state/startup.log` and `startup.json` in the detected installation folder. Request content and credentials are not intentionally logged.

If your old build shows no feedback, quit Onboard AI, download the newest repository ZIP, and rerun `bash Setup.command`. Then open the updated app from `~/Applications/Onboard AI.app`. If startup still fails, report the displayed error; do not delete settings or disable certificate validation.

## Stop an older or stuck Onboard service

Choose **AI Settings → Stop service**. The button shows **Stopping…** and reports **Local service stopped** only after shutdown is checked. It first requests authenticated shutdown, then checks for an older Onboard host occupying the local address or installation lock. It verifies the current macOS user, process start time, exact host arguments, app layout, deployment settings and app signature before signalling the process. An idle verified host that ignores normal termination is force-stopped after a grace period. Unrecognized applications are left running and reported.

**Start service** reuses a responsive current service or stops a verified older host before starting the current one. Simultaneous Start/Stop actions from updated app copies are serialized. Active child work in an older host prevents forced shutdown; let that request finish and click Stop again. Updated hosts cancel queued/local work and wait for worker cleanup. The app does not automatically restart a service after you stop it while the app remains open.

The updater uses the same verified shutdown helper before replacing existing source, so an old native-client identity failure does not by itself require deleting your installation. Quit the Onboard window, download the latest repository ZIP, and run `bash Setup.command` in the extracted folder. Existing verified models, runtime files and settings are reused.

## Reinstall after deleting the app

Keep the managed installation folder (normally `~/OnboardAI`). When the app is missing and the installation has no active service lock, setup continues without calling the missing app or requiring a successful Stop operation. Leftover socket and lock files alone do not block installation. Your settings and checked runtime/model files are preserved.

If the deleted app's background service is still holding the installation lock, restart the Mac and rerun `bash Setup.command` from the latest extracted repository ZIP. Restarting clears that process; setup does not force-stop an unverifiable process whose app bundle has been deleted. If Onboard's window is still running, quit it first.

## Diagnose Start/Stop verification failures without reinstalling

Download and extract the latest repository ZIP, then run this from that folder:

```sh
bash Diagnose.command
```

This checks the source archive and runs read-only inspection. It does not install prerequisites, download models, start services, stop processes or change settings. The result lists listener/lock-owner PIDs, executable paths and the specific verification result. It does not collect credentials, prompts or process environments. Local file paths can include your macOS username.

The verifier now asks Apple's trusted Python launcher for its kernel-reported executable instead of assuming a particular Xcode directory or executable name. It compares that exact path with the running host. A same-named Python elsewhere is insufficient; app signature, identity, ownership, deployment and process start-time checks still apply.

If diagnostics reports a verified Onboard host, run `bash Setup.command` from this latest folder to install the corrected controls. If it reports `APP_BUNDLE_MISSING`, the service still references a removed/moved app; restart the Mac before retrying. Other failures now identify their check, including `PYTHON_EXECUTABLE_MISMATCH`, `APP_SIGNATURE_INVALID`, `DEPLOYMENT_MISMATCH` and `APP_OWNER_MISMATCH`. Share the diagnostic result to resolve the failing check rather than repeatedly deleting or reinstalling the app.

## Recover a service started before the installation folder changed

An app update can leave an older service running with the previous state-folder path. The verifier now accepts that specific state mismatch only when the running process still holds its original same-user `service.lock`, its signed Onboard bundle and interpreter verify, and its launch arguments match the expected host and port. A leftover lock file, a symlink, or a lock held by another process is insufficient.

The latest setup and Start/Stop controls use this recovery. Quit the Onboard app window, download and extract the latest repository ZIP, and run `bash Setup.command` from that folder. The helper can stop the verified older host before updating the app. It leaves the older state folder intact. Active model child processes still require waiting for the request to finish before shutdown.

## Teams “Manifest parsing error message unavailable”

Use `Onboard-Teams.zip` version **0.2.1** or later. Version 0.2.0 incorrectly included `packageName`, which the declared Teams 1.17 schema disallows, and used `groupchat` instead of the required `groupChat` scope. The corrected package keeps manifest.json and both required PNG icons at the ZIP root and deduplicates validDomains. Upload the complete ZIP, not the extracted manifest or the GitHub repository ZIP. Microsoft Teams client acceptance and tenant app policies still apply.

## Outlook localhost certificate

The local add-in loads `https://localhost:38473/outlook.html`. Development certificates must be explicitly trusted on each test Mac; native app signing does not supply HTTPS trust. Use **AI Settings → Show development certificate** to locate that installation's certificate. Before granting trust, verify that it matches the certificate served by Onboard and that its localhost name and dates are valid. An authorized local development trust can be restricted to SSL for localhost in the user's Keychain. This is a machine-specific approval, not something distributed inside the Teams ZIP. Restart the add-in or Outlook after the trust change. Certificate checks must remain enabled; a production rollout needs an approved certificate deployment and renewal process.

## Microsoft access and Teams loading

Read [ACCESS-SETUP.md](ACCESS-SETUP.md) for the two different codes, Entra registration steps, exact requested permissions, and current SSO and live-verification limitations.

For Teams loading followed by a blank tab, use version **0.2.2** and update the native app/service as well as the Teams package. Reopen the tab after updating. The correction allows the required Teams frame parents, sends readiness notifications, and reports SDK/handshake errors. A manifest-only upload cannot update a running older service. Teams-supported HTTPS is still required; trusting a self-signed certificate for Outlook does not establish Teams support.

## “Unexpected Microsoft sign-in address”

The September 25 sign-in correction accepts Microsoft's newer `https://login.microsoft.com/device` verification page for Commercial/GCC device-code sign-in. The previous build rejected that real address. No redirect URI, secret, or permission change is needed for this error. Update from the latest repository using `bash Setup.command`, reopen Onboard, and start a new Microsoft sign-in. Existing verified models, settings and runtime files are reused. The change does not enable arbitrary Microsoft subdomains or change government token/Graph endpoints.

## Outlook Connect is disabled

Update the native app/service and reopen the Outlook add-in. A previous security policy blocked the exact `https://ajax.aspnetcdn.com/ajax/3.5/MicrosoftAjax.js` dependency loaded by Microsoft's Office.js SDK. The correction permits this file only for the Outlook page. Startup now times out with a visible explanation and a **Retry Outlook connection** button instead of leaving Connect disabled indefinitely. A mailbox identity is required for pairing; a selected message is required only when including that message in a request.

After a service update, sign in to Microsoft again in Onboard Settings and generate a fresh Outlook pairing code. Codes have no time-based expiry and can be used once. Generating another code replaces the previous unused code. You can right-click inside the Outlook add-in and choose **Reload** to fetch the updated page.

## Outlook context limits and cloud analysis

The local model now has a bounded 2,048-token profile: up to 1,536 input tokens (including instructions and sources), with 512 reserved for output. The fixed 5 GiB admission gate was removed at the owner’s direction; live memory-pressure, swap, thermal, protected-reserve and worker-memory guards still stop an unsafe run. This is not an unrestricted context-size setting.

Outlook can search for related mail when you submit a question. Clear **Find related emails in my mailbox when I ask** to use only the opened item and explicitly listed sources. One Graph search retrieves at most 10 accessible candidates, in addition to the opened item and its bounded thread retrieval. The local model reviews a tokenizer-sized packet; coverage notes identify omissions. This is not a background scan or an exhaustive mailbox search.

Small and medium requests that fit stay local. For larger packets, **AI Settings → Outlook and Teams connections → Allow cloud analysis of locally selected add-in content** enables a second stage with the configured GenAI provider. The add-in also shows a per-request cloud checkbox and destination. Only sources cited by the local model and checked against retrieved text can be sent. Up to five locally selected sources are eligible; the provider’s input limit can require excerpts or further omissions. The result exposes the cloud input and route. If local selection cannot be verified, no email is sent. Cloud errors retain the local result and explain the failure.

All requests still use the public-content development policy. Microsoft mailbox access is not permission to send Internal, FCI, CUI or otherwise restricted content to a provider. Set the approved provider endpoint/model and key in Settings; a key for one service cannot be assumed valid for another. Compatible endpoints can be either an API base or a complete `/chat/completions` URL.

## Teams parity and connection-code timeout removal

Update the native app/service, then reload the Outlook and Teams panels. Both now expose the shared 2,048-token local workflow and optional cloud-analysis control. Teams applies this to accessible messages in the current chat/channel and explicitly chosen sources. No new mailbox or Teams permissions are granted by this update.

Generate one new code after updating and reconnect each panel. The code no longer has a two-minute timer, and a paired Onboard connection no longer has a 30-minute timer. Codes are still one-use and replaced when another code is generated. Restarting/disconnecting or changing account/settings clears connections; reloading a panel also clears its in-memory token. Microsoft sign-in requirements are unchanged.


## Review messages before sending

Update the app/service and reopen both add-ins to see the shared **Send a message through Outlook or Teams** composer. The additional sending settings are off by default. In AI Settings, enable **Send reviewed emails** and/or **Send reviewed Teams messages**, save, and sign in again after adding the delegated permissions described in ACCESS-SETUP.md. Reconnect the add-in with a new one-use code.

Prepare and edit your message, choose a recipient, optionally check your real calendar for meeting times, click **Review message**, then **Send**. Nothing is sent merely by asking the AI. If delivery is unconfirmed, check Sent Items or Teams before creating another draft.

Source-validation errors now distinguish invalid formatting from mismatched quotations. Complete Markdown-wrapped JSON and whitespace-only quote changes can be recovered without changing facts. If validation still fails, copied source excerpts remain visible; configured and permitted cloud analysis may recover an answer. Unverified model text stays withheld.
