# Onboard AI — Outlook and Teams development add-ins

This folder contains the current development packages and their web assets. It does not contain the macOS app, AI models, account configuration, credentials, or private service state.

## Files

- `outlook.xml`: Outlook add-in manifest.
- `Onboard-Teams.zip`: Teams app package; retain this ZIP intact when distributing the Teams package.
- `Onboard-Web-Assets.zip`: packaged web interface assets.
- `web/`: the same HTML, JavaScript, CSS and images as unpacked files.
- `deployment-status.json`: current deployment limitations.
- `SHA256SUMS.txt`: checksums of this upload set, excluding the checksum file itself.

## Current status

These packages point to `https://localhost:38473` and depend on the installed Onboard AI local service. They have not been deployed or verified inside the owner's Outlook, Teams or government tenant. The development certificate is not automatically trusted. Microsoft host/schema validation, approved certificate/hosting arrangements, tenant deployment, and live connection testing remain required.

Uploading this folder to GitHub stores the files; it does not install the integrations or enable a hosted site. The manifests are not configured for a GitHub Pages address. A hosted deployment requires regenerating the manifests for its approved HTTPS address and allowing that origin in Onboard AI Settings. The local service connection still needs verification from the actual host clients.

Connection setup belongs in Onboard AI → AI Settings → Microsoft 365 and Outlook and Teams connections. Tenant/client IDs, permissions, sign-in and application pairing are configured there. Never commit API keys, access tokens, service state, local certificate private keys or model/runtime directories.

This is a development integration for user-declared PUBLIC content. Unknown, Internal, FCI and CUI are not enabled by the current development policy. The add-ins use real authorized sources when connected and report unavailable states when disconnected; they do not include synthetic mailbox data.
