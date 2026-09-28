# Onboard AI

Onboard connects Outlook, Teams and Word to the installed local AI service, with optional configured cloud analysis. This is a macOS development prototype for public-content testing.

## Current release — September 28, 2026 · native/Word 0.5

- Teams **0.4.2** uses the Azure Web App and includes personal/chat/channel tabs plus selected-message and compose actions.
- Outlook **0.5.0.0** uses the local service and native Office item/composer integration.
- Native **0.5.0** adds cloud planning with reviewed local tools; Word **0.5.0.0** adds document inspection, drafting and feedback workflows.
- Outlook can create DOCX documentation from selected/matching/recent mail and attach reviewed files in a compose window.
- Purview metadata is inspected where available; unknown, unmapped or encryption-bearing labels block processing.
- Redesigned card interface: Outlook blue, Teams purple, quick actions and expandable connection/source controls.
- Azure interface deployment and Teams desktop 0.4.2 page loading are verified. Authenticated message actions, local connection and complete drafting/sending acceptance remain separate checks.
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
| [Onboard-Teams.zip](Onboard-Teams.zip) | Current Azure Teams 0.4.2 package; upload intact to the existing catalog app. |
| [Onboard-Teams-Actions.zip](Onboard-Teams-Actions.zip) | Identical explicit-name copy of the Teams 0.4.2 package. |
| [word.xml](word.xml), [word-hosted.xml](word-hosted.xml) | New Word task-pane manifests for local or commercial Azure hosting. |
| [HYBRID-WORD.md](HYBRID-WORD.md) | Hybrid setup, Word installation, document/attachment workflows and label limitations. |
| [outlook.xml](outlook.xml) | Outlook 0.5.0.0 local-service manifest. |
| [Onboard-Azure-WebApp.zip](Onboard-Azure-WebApp.zip) | Deployed Node handler and public interfaces with pinned production dependencies. |
| [Onboard-Web-Assets.zip](Onboard-Web-Assets.zip), [web/](web/) | Matching hosted interface files. |
| [Onboard-Source.zip](Onboard-Source.zip) | Full current application, local AI, add-in and handler source, dependency notices and retained runtime verification inputs. |
| [source-release.json](source-release.json), [SHA256SUMS.txt](SHA256SUMS.txt) | Source identity and release checksums. |
| [deployment-status.json](deployment-status.json) | Verified deployment state and outstanding acceptance checks. |

Model weights download from pinned publishers during setup. Credentials, private account state, customer content and local model caches are excluded. The source archive preserves original project paths and contains a per-file SOURCE-INVENTORY.json. The development app is built on the destination machine so its runtime paths match that installation.

## Add-in setup and use in conversations

Read [ACCESS-SETUP.md](ACCESS-SETUP.md) for Entra/Graph permissions, native connection approval, app-first workflows and reviewed sending. [AZURE-SETUP.md](AZURE-SETUP.md) describes the commercial bot and hosting deployment.

Teams: **Apps → Built for your org → Onboard AI**, then choose a chat/channel. Use the message's **More actions** menu or compose-box **Actions and apps** for Onboard actions. A personal tab has no current conversation. This handler does not implement free-form @mention bot replies.

If an old personal installation still opens Netlify, remove that Onboard personal app and re-add the current organization catalog version. Check **About → 0.4.2**. Installing the native Mac app alone does not update the Teams catalog.

Connect through **Connection → Connect to Onboard**, then approve in the native app using the same Microsoft account. The configured hosted origin and localhost certificate must be approved. Codes remain an advanced fallback; host SSO is not implemented. Generated messages remain drafts until reviewed and sent by the user.

## Validation and limitations

The Azure pages match the deployed release bytes. Health succeeds, unauthenticated bot requests are rejected, and private files are not served. The 275 Python tests, 69 JavaScript interface tests, nine Node handler/server tests and four Rust policy tests pass; the development Mac app rebuilt and installed with a verified ad hoc signature. [SETUP-VERIFICATION.md](SETUP-VERIFICATION.md) retains earlier setup evidence.

Live Word insertion/attachment and Purview policy acceptance, authenticated Teams actions, a new end-to-end Outlook/Teams-to-local-AI session, second-machine acceptance, GenAI.mil integration and government authorization are not established by these deployment checks. No real messages were sent during this release update.

For the new workflows, start with [HYBRID-WORD.md](HYBRID-WORD.md). Hybrid tasks are disabled until configured in AI Settings. Updating the Mac app does not automatically install Word in the Office tenant. GenAI capability remains an implementation assumption pending actual endpoint validation.
