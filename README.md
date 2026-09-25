# Onboard AI

Onboard AI combines a native macOS Ask AI dashboard, a shared local AI service, Outlook and Teams add-ins, and settings for Microsoft 365, public web search and optional GenAI API connections.

## Install on another Mac

Start with **[INSTALL.md](INSTALL.md)**. Download this repository using **Code → Download ZIP**, extract it, open Terminal in the extracted folder and run:

```sh
bash Setup.command --plan
bash Setup.command
```

The current setup is a **development source installer for Apple silicon on macOS 26 or later**, with one setup script that installs missing Apple developer tools and the official Rust toolchain. If Apple’s installation dialog opens, complete it and press Return in Terminal to continue. It downloads the exact Qwen3-1.7B model and runtime dependencies, verifies SHA-256 checksums, performs fresh local worker/monitor checks, builds the app and installs it for the current user. Approximately **1.42 GB** is downloaded, plus any missing Rust build dependencies. The model then stays on the Mac for offline local AI. This is not a notarized customer installer; Windows and Intel Mac builds are not provided.

The default installation folder is `~/OnboardAI`; keep it in place. Setup detects managed existing installations, reuses verified model/runtime files, preserves settings, and backs up replaced source files and the previous app. Quit Onboard AI and rerun the same setup command to update. Connections and credentials are configured later in **AI Settings**. No account state or API keys are included in this repository.

If an earlier setup stopped with “Packaged Python identity did not match,” use the recovery command in [INSTALL.md](INSTALL.md). The fixed installer carries the exact qualified Python executable, verifies its existing hash/signature, and can reuse checked downloads from the earlier folder.

## Diagnose a service problem

From the latest extracted repository ZIP, run `bash Diagnose.command`. It reports the exact verification failure without installing, starting, stopping, or downloading anything. Share the result if Start or Stop service reports an older-installation verification failure.

## Service controls

Use **AI Settings → Stop service** to stop the current or a verified older Onboard host. The app displays progress and checks that shutdown completed. **Start service** automatically recovers an idle verified older host occupying the address. A service using a previous installation folder can be recovered when its original live lock and remaining identity checks verify. Other applications are left running. Updated setup includes this recovery and preserves verified existing model/runtime files and settings.

## Browser choice

Under **AI Settings → Internet access**, select an installed **Browser** (or the macOS default) and a **Search engine**, then save. General internet searches open there without a Brave API key. Browser results stay in the browser; Onboard does not automatically read its tabs or treat opening a page as a verified answer. Weather remains a direct lookup. Browser network/proxy errors appear in the browser.

## Application source

**[Onboard-Source.zip](Onboard-Source.zip)** contains the complete current integrated application source and supporting local AI code, organized using the original project paths:

- `product/integrated/macos/`: SwiftUI Ask AI and Settings dashboard.
- `product/integrated/service/`: shared service, Graph and GenAI adapters, web/weather lookup, policy routing and local model adapter.
- `product/integrated/core/` and `product/meeting_briefing/core/`: Rust policy and source validation.
- `product/integrated/local/` and `product/local_ai/`: retained local model worker, resource guards, lifecycle checks, supporting calibration source, dependency locks and notices.
- `product/integrated/web/`: Outlook and Teams interfaces.
- `product/integrated/tools/` and `setup/`: build, setup, installation and export tools.
- `SOURCE-INVENTORY.json`: per-file source checksums.

The source is provided as an archive to preserve its directory layout through browser upload. Model weights, installed environments, credentials, private service state and unrelated historical model downloads are excluded. `source-release.json` identifies the source archive and exact model version. The setup downloads assets directly from their pinned publishers; it does not choose a newer model automatically. Third-party notices are retained in the source archive. The ZIP also includes the exact previously qualified Python executable (about 17 MB before ZIP compression) and its Python license, so the destination Mac does not have to recreate its signature.

## Outlook and Teams

- [outlook.xml](outlook.xml): Outlook add-in manifest.
- [Onboard-Teams.zip](Onboard-Teams.zip): Teams **0.3.0** package, validated against the declared Microsoft schema; keep this ZIP intact.
- [Onboard-Web-Assets.zip](Onboard-Web-Assets.zip) and [web/](web/): interfaces and icons.
- [deployment-status.json](deployment-status.json): current add-in deployment status.

The add-ins currently use `https://localhost:38473`, the Onboard service on the same machine running the client. GitHub stores these files; it is not currently hosting their pages. Installing Onboard AI does not install the add-ins. HTTPS trust, approved tenant deployment and actual host integration tests remain required. See [ACCESS-SETUP.md](ACCESS-SETUP.md) for Microsoft access setup and current limitations.

## What has been verified

[SETUP-VERIFICATION.md](SETUP-VERIFICATION.md) records successful setup/build in a separate folder on the development Mac. A second physical Mac and actual Outlook/Teams/Graph/cloud acceptance remain pending. The current content policy permits only user-declared PUBLIC data; sensitive enterprise content is not enabled.

## Microsoft tenant detection and access

In **AI Settings → Microsoft 365**, leave **Environment** on **Automatic**, enter the organization-approved tenant and application IDs, select required read capabilities and save. **Detect tenant environment** previews the result; sign-in also detects automatically. Microsoft metadata selects Commercial, GCC, GCC High or DoD and its corresponding Graph endpoint. Conflicting metadata or a blocked request stops sign-in; tokens are not retried through another cloud.

[ACCESS-SETUP.md](ACCESS-SETUP.md) explains Entra registration, delegated permissions, Microsoft sign-in and the native account-matched connection approval, and the intended SSO experience. **Teams/Outlook host SSO is not implemented yet.** Live organizational sign-in and Graph acceptance remain pending approved configuration.

The Teams loading correction updates both the native service and tab code. Update the app as well as the Teams package. The local pages pass native macOS HTTPS validation, but the tested Teams client still shows an embedded browser error. A supported Teams HTTPS deployment remains unresolved; the update is not evidence of a working end-to-end Teams integration.

## Microsoft sign-in address correction

If sign-in stops with “Unexpected Microsoft sign-in address,” update from the latest repository ZIP and rerun `bash Setup.command`. Microsoft now returns `https://login.microsoft.com/device` for this commercial device-code flow; the corrected app accepts that exact address. Your Entra redirect settings do not need changing. Verified models and existing settings are reused.

## Outlook Connect button

The latest app corrects a blocked Microsoft Office.js dependency that left Outlook's Connect button disabled. The fix was verified in the actual Outlook for Mac add-in. Update the native app/service, reload the add-in, sign in again in Onboard Settings, choose Connect to Onboard in Outlook and approve in the native app. Initialization failures now display a reason and offer a retry button.

## Outlook local review and cloud analysis update

The local model now supports a bounded 2,048-token window (1,536 input including instructions, 512 output). Outlook can search related mail on request, then local AI selects source-backed evidence. Larger requests can use the configured cloud provider when add-in cloud assistance and per-request permission are enabled. The result shows partial coverage, route, and cloud input. Small/medium requests that fit stay local. Public-content development policy remains enforced. See [setup details](ACCESS-SETUP.md) and [update instructions](INSTALL.md).

The fixed 5 GiB planning admission gate was removed at the owner’s direction; live pressure, swap, thermal, protected-reserve and process-memory guards remain. Source citations passed on an actual 1,086-input-token public-document run. Full mailbox relevance and cloud end-to-end acceptance remain to be verified in the configured environment.

## Teams parity and connections without a timer

Teams and Outlook share the 2,048-token local workflow and optional cloud analysis of locally selected evidence. Teams uses accessible messages from the current chat/channel and explicitly supplied sources; Outlook additionally offers related-mail search.

Connection codes now have no time-based expiry and remain one-use. Paired Onboard sessions have no 30-minute timeout. Creating a new code replaces the previous unused code. Disconnect, service restart and account/settings changes invalidate connections; a panel reload clears its in-memory token. Microsoft sign-in rules still apply. Update the app/service and reload both add-in panels to receive these changes.


## Reviewed cross-app messages and source-validation recovery

Both add-ins now provide **Send a message through Outlook or Teams**: prepare a conversational draft from selected sources, select a recipient, optionally add actual calendar availability, review the exact message, then click **Send**. Email is a new message; Teams is a one-to-one message to a resolved person inside your organization. No meeting is booked. Optional delegated sending permissions are disabled by default; [access setup](ACCESS-SETUP.md) lists the exact permissions and Settings switches.

Source validation now accepts harmless JSON wrappers and whitespace-only quotation differences while retaining exact original-source checks. If the AI output still fails, copied source excerpts are shown and configured, permitted cloud assistance may analyze the locally selected evidence. Invalid model output is withheld. Update the native app/service and reopen both add-ins. Existing models are reused.

182 Python controls, 25 JavaScript controls and four Rust tests passed. A real offline public-document run completed with 1,105 prompt tokens and valid source quotations. Sending and calendar behavior have controlled tests; live tenant sending is pending consent, sign-in and user-reviewed testing. No real email or Teams message was sent during validation.


## Suggest a reply correction

Reply drafting now uses the selected email without automatically searching unrelated mail or adding its thread. **Also search related emails** starts off and must be explicitly selected. Generic reply instructions are not search topics, and explicit searches require all selected topic terms. Specific additional sources remain available.

Email tracking URLs and standard footer blocks are excluded from AI context unless the question asks about them. Original source text remains available; no email link is opened. The model selects numbered evidence references, and Onboard attaches and checks the exact text. A narrow JSON structural repair handles one observed extra brace without changing field values. Unknown references, ambiguous aliases, conflicting quotes, incomplete output and copied placeholders still fail. The interface shows source titles instead of long mailbox IDs.

202 Python checks, 27 JavaScript checks and four Rust tests passed. A captured real offline model response on public installation documentation produced a first-person acknowledgment and passed the corrected parser/reference validation. This is not a live Outlook mailbox acceptance claim. Update the native app, sign in again after the service restart, reconnect Outlook, open the intended email and choose **Suggest a reply** with **Include the opened item** on and **Also search related emails** off.

## Cleaner replies and no-code connections

The draft box now contains the proposed reply only. Supporting quotations and original source text are collapsed under one heading per source, and missing-information notes remain outside the draft. An explicit no-reply notice in the selected email recommends against replying instead of generating a meeting request. Conversational drafts no longer ask for a meeting by default.

In either add-in, choose **Connect to Onboard**, then click **Allow connection** at the top of the Onboard desktop app. The reported Outlook/Teams account must match Onboard's authenticated Microsoft account. Native approval authorizes the connection; a matching account string alone grants no access. No typed local code is required. Codes remain an optional advanced fallback. Microsoft host SSO is still not implemented. Restarting or reloading requires reconnecting and approving again; Microsoft sign-in policies still apply.

Update through **Setup.command**, quit/reopen the native app, sign in, and reload each add-in. Existing models/runtime files are reused. 211 Python checks, 31 JavaScript checks and four Rust checks passed; the signed development build was installed and its service started. Actual approval inside Outlook/Teams and the reported email still require a live acceptance check. No real email or Teams message was sent during testing.


## App-first Outlook and Teams update

Outlook now reads the opened item directly from Office. Related-mail search and extra thread/calendar context through Graph are explicit options. After reviewing the generated text, open a native Outlook reply or insert it into the current draft, then send in Outlook. The updated Outlook manifest requests ReadWriteItem for composing.

In a Teams chat/channel tab, load the recent messages and select one to work with. Graph supplies the authorized text; a separate option includes recent conversation context. Open a reviewed draft in a one-to-one Teams chat for a recipient you choose, then send in Teams. Personal tabs have no current conversation, channel replies are not listed, and this update does not add a right-click message extension.

Update the app with Setup.command and update/reload both add-ins: Outlook 0.3.0.0 and Teams 0.3.0. The existing model is reused. Native approval remains the connection method; Microsoft host SSO is still pending. See [ACCESS-SETUP.md](ACCESS-SETUP.md#app-first-add-ins-september-25-2026).

Validation: 220 Python tests, 45 JavaScript tests, and four Rust tests passed. The development app was built and installed with a verified ad hoc signature. Actual Outlook/Teams composer acceptance is pending; no real messages were sent.


### Outlook ↔ Teams through Onboard

Both add-ins now have **Transfer this draft to the other add-in** and **Local draft inbox**. Onboard holds the reviewed draft in memory, categorized as a reply, summary, meeting request, follow-up, or other. The destination add-in must connect to the same local Onboard instance and Microsoft account. It opens a native email or one-to-one Teams draft for your final review and sending; Graph is not used to send this handoff.

The queue holds at most 20 pending drafts. Service restart, sign-out, or settings changes clear it. Explicit source disconnect removes that session's outgoing transfers. Closing the panel alone leaves transferred drafts available. This is temporary local draft memory, not a permanent knowledge index. No original source archive or account token is put in the queue. Duplicate retries do not create duplicate transfers, and a destination draft is claimed once.

Combined validation: 235 Python tests, 54 JavaScript tests, and four Rust tests passed. Live in-host acceptance is pending. No real email or Teams message was sent. See ACCESS-SETUP.md for the exact handoff workflow and limitations.

### Local runtime diagnostics update

Local guard stops now show a specific reason and action instead of a combined resource/runtime/lifecycle error. Only a content-free latest-run diagnostic is retained locally. Runtime limits are unchanged.
