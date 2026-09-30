# Onboard AI

Onboard connects Outlook, Teams and Word to the installed local AI service, with optional configured cloud analysis. This is a macOS development prototype for public-content testing.

## Current release — September 30, 2026 · native 0.7.3 / add-ins 0.6.1

- Native 0.7.3 adds Activity diagnostics, encrypted model scratch storage, worker isolation, central audit tooling and signed-update verification. It is installed and verified on the development Mac. See [RELEASE-0.7.3.md](RELEASE-0.7.3.md) and [HARDENING-0.7.3.md](HARDENING-0.7.3.md).
- Native 0.7.0 introduced saved offline task plans, checkpoint recovery, optional cloud repair and reviewed macOS/browser controllers. See [TASK-CONTROLLERS.md](TASK-CONTROLLERS.md) for setup, permission requirements and validation limits. The Activity view and installed local-model path have passed local checks; broader controller workflows still need live acceptance.
- Native 0.6.3 adds experimental TurboQuant K8/V4 cache compression, cloud assistance after clean local resource stops, and admission with stable existing swap. See [TURBOQUANT.md](TURBOQUANT.md) for settings and measured limits. Existing model weights are reused.
- Microsoft browser sign-in uses your saved browser and PKCE. CAC/certificate sign-in is available when configured by your tenant; register `http://localhost/onboard-signin` as a desktop redirect. See ACCESS-SETUP.md.
- Encrypted **Saved work** shares explicitly reviewed PUBLIC drafts across the desktop, Outlook, Teams and Word, including after restart and sign-in. Seven-day expiry; no automatic source-content cache.
- Failed native draft openings preserve the transfer for recovery.
- Optional administrator-owned endpoint restrictions and authenticated connection diagnostics are included.
- Teams package **0.6.1** uses the Azure Web App and includes personal/chat/channel tabs plus selected-message and compose actions.
- Outlook **0.6.1.0** uses the local service and native Office item/composer integration.
- Native **0.7.0** introduced cloud planning with reviewed local tools; Word **0.6.1.0** adds document inspection, drafting and feedback workflows.
- Outlook can create DOCX documentation from selected/matching/recent mail and attach reviewed files in a compose window.
- Purview metadata is inspected where available; unknown, unmapped or encryption-bearing labels block processing.
- Redesigned card interface: Outlook blue, Teams purple, quick actions and expandable connection/source controls.
- Azure interface deployment is tracked in deployment-status.json. The Teams catalog was last verified at 0.6.0; this release has not updated it and desktop-client acceptance remains pending. Authenticated message actions, local connection and complete drafting/sending acceptance remain separate checks.
- Netlify is not used. Commercial Azure testing does not establish government deployment approval.

## Install or update the Mac app

Download **Code → Download ZIP**, extract it, open Terminal in that folder, then run:

```sh
bash Setup.command --plan
bash Setup.command
```

See [INSTALL.md](INSTALL.md). Requires Apple silicon and macOS 26+. The script installs missing prerequisites, verifies and reuses existing model/runtime assets, preserves settings, and builds/installs the app. The first model/runtime download is approximately 1.42 GB. It is not a notarized installer. Windows and Intel Mac builds are not supplied. Keep the managed installation folder in place.

## Release files

| File | Purpose |
| --- | --- |
| [Onboard-Teams.zip](Onboard-Teams.zip) | Prepared Azure Teams 0.6.1 package; upload intact to the existing catalog app. |
| [Onboard-Teams-Actions.zip](Onboard-Teams-Actions.zip) | Identical explicit-name copy of the Teams 0.6.1 package. |
| [word.xml](word.xml), [word-hosted.xml](word-hosted.xml) | New Word task-pane manifests for local or commercial Azure hosting. |
| [HYBRID-WORD.md](HYBRID-WORD.md) | Hybrid setup, Word installation, document/attachment workflows and label limitations. |
| [outlook.xml](outlook.xml) | Outlook 0.6.1.0 local-service manifest. |
| [Onboard-Azure-WebApp.zip](Onboard-Azure-WebApp.zip) | Prepared Node handler and public interfaces with pinned production dependencies. |
| [Onboard-Web-Assets.zip](Onboard-Web-Assets.zip), [web/](web/) | Matching hosted interface files. |
| [Onboard-Source.zip](Onboard-Source.zip) | Full current application, local AI, add-in and handler source, dependency notices and retained runtime verification inputs. |
| [source-release.json](source-release.json), [SHA256SUMS.txt](SHA256SUMS.txt) | Source identity and release checksums. |
| [deployment-status.json](deployment-status.json) | Verified deployment state and outstanding acceptance checks. |

Model weights download from pinned publishers during setup. Credentials, private account state, customer content and local model caches are excluded. The source archive preserves original project paths and contains a per-file SOURCE-INVENTORY.json. The development app is built on the destination machine so its runtime paths match that installation.

## Add-in setup and use in conversations

Read [ACCESS-SETUP.md](ACCESS-SETUP.md) for Entra/Graph permissions, native connection approval, app-first workflows and reviewed sending. [AZURE-SETUP.md](AZURE-SETUP.md) describes the commercial bot and hosting deployment.

Teams: **Apps → Built for your org → Onboard AI**, then choose a chat/channel. Use the message's **More actions** menu or compose-box **Actions and apps** for Onboard actions. A personal tab has no current conversation. This handler does not implement free-form @mention bot replies.

If an old personal installation still opens Netlify, remove that Onboard personal app and re-add the current organization catalog version. After an administrator uploads this release, check **About → 0.6.1**. The catalog was last verified at 0.6.0 and still needs that update. Installing the native Mac app alone does not update the Teams catalog.

Connect through **Connection → Connect to Onboard**, then approve in the native app using the same Microsoft account. The configured hosted origin and localhost certificate must be approved. Codes remain an advanced fallback; host SSO is not implemented. Generated messages remain drafts until reviewed and sent by the user.

## Validation and limitations

See deployment-status.json for deployment boundaries. Validation passed: 377 Python tests, 77 JavaScript interface tests, 11 Node handler/server tests and four Rust tests, plus eight real OS/storage/mTLS checks and six native identity checks. The installed 0.7.3 app passed a real local-model request and its Activity view was verified on screen. The build uses an ad hoc development signature; it is not notarized. [SETUP-VERIFICATION.md](SETUP-VERIFICATION.md) records current and earlier setup evidence.

Live Word insertion/attachment and Purview policy acceptance, authenticated Teams actions, a new end-to-end Outlook/Teams-to-local-AI session, second-machine acceptance, GenAI.mil integration and government authorization are not established by these deployment checks. No real messages were sent during this release update.

For priorities and the exact completed/pending boundary, start with [PRODUCT-STATUS.md](PRODUCT-STATUS.md). Administrator restrictions are described in [MANAGED-POLICY.md](MANAGED-POLICY.md). Run `python3 verify_release.py` to verify the downloaded release without installing it.

For the new workflows, start with [HYBRID-WORD.md](HYBRID-WORD.md). Hybrid tasks are disabled until configured in AI Settings. Updating the Mac app does not automatically install Word in the Office tenant. GenAI capability remains an implementation assumption pending actual endpoint validation.
