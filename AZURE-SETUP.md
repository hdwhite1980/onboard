# Azure Bot setup for Onboard commercial testing

Status on September 27, 2026: The dedicated application identity and **onboard-teams-test** Azure Bot were created successfully. The bot is on the **F0 free tier**, in **rg-onboard-teams-test** under the owner's existing Azure subscription. The **Microsoft Teams Commercial** channel is saved. The free Linux Node 22 Web App **onboard-teams-test-web** is created in **West US 3**, on plan **ASP-rgonboardteamstest-b6ed (F1)**. Its deployed health, interface assets, trusted HTTPS, unauthenticated-request rejection and private-file rejection passed live checks. The bot messaging endpoint is saved as `https://onboard-teams-test-web-f3amchf5fwaeb7hj.westus3-01.azurewebsites.net/api/teams/actions`; Azure reports the Microsoft Teams channel as Healthy. Live Teams action verification remains pending.

| Item | Verified value |
| --- | --- |
| Subscription account | Owner-selected Azure account |
| Subscription ID | `b0da3a05-030f-417d-a8ce-a1173042049e` |
| Subscription directory | `b323be76-6b09-4d89-a139-4a3c5e4f2b82` (Default Directory) |
| Teams directory | `aceff5a6-7694-4ee9-bcc5-ab116cdf3e5d` (MSFT / 4prebuild.com) |
| Registered application name | `Onboard Teams Actions - Commercial Test` |
| Bot application (client) ID | `7c4cee75-a078-4b66-9392-acd0a5c7626a` |
| Application object ID | `23b9b2c9-7d59-41e3-802e-bcae5aa3448f` |
| Azure Bot resource | `onboard-teams-test` |
| Resource group | `rg-onboard-teams-test` (East US) |
| Bot tier / residency | `F0` / Global |
| Teams channel | Commercial, saved |

The Azure Bot form accepted explicit App ID and App tenant ID under **Use existing app registration**. Deployment completed with the identity in the Teams directory and the Azure resource in the existing subscription. Live operation remains unverified; the subscription has not been moved. No client secret or redirect URI was created for the dedicated bot identity.

The owner selected commercial Microsoft 365 for current testing. This does not establish government deployment readiness. Netlify remains disabled.

## 1. Make the existing subscription accessible

In the Azure portal, select the account and directory that own the intended subscription. Verify it appears under **Subscriptions**. If another administrator manages it, ask them to arrange the necessary deployment access to a dedicated Onboard test resource group and the required application-registration access. Do not move an existing subscription between directories as a troubleshooting shortcut.

The current Teams tenant is `aceff5a6-7694-4ee9-bcc5-ab116cdf3e5d`. If the subscription belongs to a different directory, resolve the bot identity/tenant arrangement before provisioning; do not silently substitute that directory for the Teams tenant.

## 2. Register the bot

In Azure, choose **Create a resource → Azure Bot → Create**. Suggested Onboard-specific values:

| Setting | Value |
| --- | --- |
| Bot handle | `onboard-teams-test` (use an available name) |
| Subscription | The owner's existing, approved test subscription |
| Resource group | A dedicated group such as `rg-onboard-teams-test` |
| Pricing | Free/F0 if offered; inspect the actual review page |
| Application type | Single tenant |
| Identity | A dedicated bot application in the commercial Teams tenant |
| Tenant | `aceff5a6-7694-4ee9-bcc5-ab116cdf3e5d` |

Review the proposed resources and charges before creation. Record the bot's **Microsoft App ID** and **App Tenant ID** from Configuration. Keep the existing native Graph application separate. This selected-message handler does not require new Graph permissions or a redirect URI.

Microsoft requires an Azure subscription and supports single-tenant registration. [Azure Bot creation instructions](https://learn.microsoft.com/en-us/azure/bot-service/abs-quickstart?view=azure-bot-service-4.0).

## 3. Choose and deploy the HTTPS handler

Registration alone does not run the handler. An organization-approved host must serve both the add-in interface and `/api/teams/actions` over trusted HTTPS. The host receives the selected Teams message; it is not merely a certificate service. The approved commercial test host is `https://onboard-teams-test-web-f3amchf5fwaeb7hj.westus3-01.azurewebsites.net`. SharePoint is not required. East US creation failed because this subscription had zero F1 quota there; West US 3 F1 creation succeeded. No paid plan was selected. Do not expose the Mac's endpoint AI service or reactivate Netlify.

Bot Service lists Teams as a standard channel with a free tier; hosting and other resources can have separate charges. [Microsoft pricing](https://azure.microsoft.com/en-us/pricing/details/bot-services/).

Once the real bot ID and approved host are known, run from the repository root, replacing both placeholders:

```sh
python3 product/integrated/tools/package_teams_actions.py \
  --base-url https://YOUR-APPROVED-HOST \
  --bot-id YOUR-BOT-APPLICATION-ID \
  --tenant-id aceff5a6-7694-4ee9-bcc5-ab116cdf3e5d
```

This stages files in `product/integrated/build/teams-actions`; it does not deploy them. The host needs Node.js 22 or later and the pinned dependencies. Use `pnpm install --prod --frozen-lockfile --ignore-scripts --node-linker=hoisted`, then `node server.mjs`. The server serves a fixed allowlist of public interface assets with Microsoft framing/CSP restrictions, `/healthz`, and the authenticated actions route. The default listener is `127.0.0.1:3978`; Azure requires `BIND_ADDRESS=0.0.0.0` and supplies `PORT`. Azure terminates HTTPS. No local AI endpoint or private state is included.

Configure these environment variables using the generated `deployment-environment.json`:

| Variable | Value |
| --- | --- |
| `ONBOARD_TEAMS_BOT_ID` | Dedicated bot application's client ID |
| `ONBOARD_TEAMS_TENANT_ID` | Commercial Teams tenant ID above |
| `ONBOARD_TEAMS_ORIGIN` | Exact approved HTTPS origin, without a path |
| `ONBOARD_TEAMS_CLOUD` | `commercial` |

The current inbound-only handler verifies Microsoft's signed requests and responds to invoke activities. It does not require an OpenAI key or a bot client secret. Do not copy either into public assets. This is specific to this handler, not a general rule for all Azure bots.

## Prepared Cloud Shell deployment

The tested deployment ZIP is `build/teams-actions/Onboard-Azure-WebApp.zip` (399 files, 537,825 bytes; SHA-256 `e052cdc212e875676b34a806c4d035b22794ffa1d9d51e3e71a08a5757e5c018`). The latest ZIP includes the Viva-inspired Outlook blue and Teams purple interface update. It was deployed through Azure Kudu on September 28, 2026; the live HTML, scripts and stylesheet match the staged files exactly. Teams desktop 0.4.2 loads the Azure interface. The prior ZIP passed standalone extraction/startup checks. Nine Node handler/server tests and one package test passed. These are local tests, not live Azure or Teams acceptance.

In Azure Cloud Shell **Bash**, use **More commands → Upload/Download files → Upload** to upload that ZIP and `tools/deploy_azure_test.sh` into the same directory. Then run:

```bash
bash deploy_azure_test.sh
```

The script checks the exact ZIP, subscription directory, F1 plan, hostname and bot identity; sets the nonsecret handler configuration; deploys using Azure CLI; checks trusted HTTPS, health, interface CSP, unauthorized-request rejection and private-file rejection; then sets and verifies the bot endpoint. It creates no resources or credentials, and does not enable basic deployment authentication. It stops on error. Its pinned ZIP digest must be regenerated/reviewed if the runtime package changes. The Teams catalog update and real local-account workflow remain separate steps.

Browser control could read Cloud Shell but could not send clicks or keystrokes, even after reconnecting. The local Azure CLI sign-in was denied with error 530035; no sign-in policy was altered. The script has been syntax checked; its execution by the owner has not been observed. Subsequent direct HTTPS checks verified deployed code. The bot endpoint was still blank and was then set through the Azure portal, which confirmed Saved Configuration.

Deployment references: [Azure ZIP deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip), [Azure Bot endpoint update](https://learn.microsoft.com/en-us/cli/azure/bot#az-bot-update).

## 4. Connect Teams and install the action package

Set the Azure Bot **Configuration → Messaging endpoint** to `https://YOUR-APPROVED-HOST/api/teams/actions`. Under **Channels**, add **Microsoft Teams**, review its terms, select the commercial cloud, and apply. [Microsoft Teams channel instructions](https://learn.microsoft.com/en-us/azure/bot-service/channel-connect-teams?view=azure-bot-service-4.0).

Update the existing Teams catalog application with `build/teams-actions/Onboard-Teams-Actions.zip` (version 0.4.2). Preserve its application identity. The existing local-tab package is 0.4.1 and does not contain the new message actions.

In Onboard Settings, select organization-managed HTTPS hosting and approve only the exact interface origin. A trusted localhost connection and matching signed-in accounts are still required to reach the local AI.

## 5. Verify actual behavior

Using a real, non-sensitive test message in Teams, verify **Summarize**, **Suggest a reply**, and **Send to Outlook**. Confirm that the selected message opens in the dialog, account matching works, and generated replies remain drafts for review. Verify the user must send the message themselves. Check that invalid authentication and the wrong tenant are rejected.

All live Teams message-action validation is pending. The commercial handler does not yet implement or validate government-specific authentication. Government hosting, tenant configuration, and GenAI.mil setup require separate customer-approved configuration.

## Updating through Azure Kudu

From the Web App, choose **Development Tools → Advanced Tools → Go to Kudu → Deployments**. Upload `Onboard-Azure-WebApp.zip`, select **Skip Server-Side Build (Pre Built App)** because pinned production dependencies are included, and deploy. Keep the existing Node 22 runtime, `node server.mjs` startup and nonsecret bot settings. Verify the health endpoint and actual Teams interface after deployment. This path succeeded on September 28 without enabling basic publishing authentication or changing plans.
