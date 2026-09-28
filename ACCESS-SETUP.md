# Onboard Microsoft 365 access setup

Onboard should use the signed-in user's existing Microsoft 365 access. Microsoft Graph still requires an Entra application identity and consent for the permissions Onboard requests. With **delegated permissions**, effective access is limited by both the permissions approved for Onboard and what the signed-in user can access. An existing Teams or Outlook session alone does not authorize an arbitrary add-in to read the user's mailbox, files or conversations. See [Microsoft's permissions explanation](https://learn.microsoft.com/en-us/graph/permissions-overview).

## Current commercial test release — September 28, 2026

Use **Onboard-Teams.zip (0.4.2)** from the repository root for the current commercial test deployment. It is the same package as **Onboard-Teams-Actions.zip** and points to `https://onboard-teams-test-web-f3amchf5fwaeb7hj.westus3-01.azurewebsites.net`. The organization catalog and this Mac's personal installation were verified at 0.4.2. The old 0.3.1 Netlify installation has been removed. Outlook's local manifest is **outlook.xml (0.4.1.0)**. The source installer builds the latest native app and redesigned interfaces, reusing verified model/runtime files.

The Outlook blue / Teams purple card interface is deployed to Azure. GitHub stores the release files and source; it does not serve the running interface. In **AI Settings → Add-in hosting**, choose **Organization-managed HTTPS host** and approve the exact Azure origin above for this commercial test. The local TLS certificate must also be trusted and the same Microsoft account signed in to Onboard. Click **Connection → Connect to Onboard**, then approve in the native app. No code is needed for this flow.

To use Onboard in a conversation, open **Apps → Built for your org → Onboard AI** and choose the intended chat/channel. The package also declares **Summarize**, **Suggest a reply**, and **Send to Outlook** under message actions and the compose-box Apps menu. These use the Azure Bot handler; no ordinary @mention chat bot is implemented. A chat tab uses Graph to retrieve permitted messages; the message action uses the message explicitly selected in Teams. Full authenticated action/local-AI acceptance is still pending. The personal app is not itself a conversation tab.

If Teams still shows Netlify or 0.3.1, remove its old **personal app** through **Apps → Manage your apps**, then add Onboard from **Built for your org**. Confirm **About → Version 0.4.2**. Do not install the local-only 0.4.1 package for this Azure action deployment. Hosting/certificate approval and commercial testing do not establish government authorization.

See **AZURE-SETUP.md** in the release folder, or `product/integrated/teams-actions/AZURE-SETUP.md` inside the source archive, for hosting and bot configuration. The historical sections below describe earlier stages; this section defines the current package selection.

## What the current build actually supports

This build uses a separate Microsoft browser sign-in (authorization code with PKCE) in the native app and an account-matched approval in the native app to connect each add-in to the local AI service (no typed connection code required). It does **not** yet implement Teams or Outlook single sign-on (SSO).

**AI Settings → Microsoft 365 → Environment → Automatic** now discovers the configured tenant's environment from Microsoft's HTTPS OpenID metadata before sign-in. Commercial, GCC, GCC High and DoD are supported routing choices. The **Detect tenant environment** button checks the entered tenant ID without signing in or reading organizational content. Save the tenant/client IDs and permissions before selecting **Sign in in browser — CAC or credentials**; detection also runs automatically during that sign-in.

| Detected environment | Sign-in authority | Graph endpoint |
| --- | --- | --- |
| Commercial / GCC | `login.microsoftonline.com` | `graph.microsoft.com` |
| GCC High | `login.microsoftonline.us` | `graph.microsoft.us` |
| DoD | `login.microsoftonline.us` | `dod-graph.microsoft.us` |

Endpoint mapping follows [Microsoft's national cloud deployments](https://learn.microsoft.com/en-us/graph/deployments). Government discovery is confirmed at the government authority before an authorization or token request. Discovery checks `msgraph_host`, region/subregion, tenant-specific issuer and token endpoint. Region/subregion interpretation also appears in [CISA's tenant environment checks](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/Modules/Providers/ExportPowerPlatformProvider.psm1). Unexpected or conflicting metadata stops sign-in; it never guesses from an email suffix or retries a blocked request through another cloud.

Automatic discovery initially sends the configured tenant ID to Microsoft's public metadata endpoint; it sends no credentials or organizational content. Organizations requiring government-only discovery can select GCC High or DoD explicitly; that selection is verified against government metadata. Explicit selections cannot override a conflicting response. Network/proxy failures stop the check and are displayed.

Only one tenant/account is active at a time. After changing the tenant/client IDs, save and sign in again; previous tokens and paired sessions are cleared. The app chooses endpoints automatically, but does not discover the user's account from Teams, create registrations, transfer consent, or make a commercial app registration valid in government clouds. An approved app ID in the correct environment is still required.

Routing and rejection paths have automated control tests. Live sign-in, delegated Graph retrieval, and government-cloud acceptance require actual approved tenant/app configuration and remain unverified. No successful sign-in or enterprise content was fabricated.

## Connect Outlook or Teams without copying a code

1. Start **Onboard AI** and sign in to Microsoft 365 in **AI Settings** using the same account as Outlook or Teams.
2. In the add-in, click **Connect to Onboard**.
3. Switch to the Onboard app. A request appears at the top of either Ask AI or AI Settings, showing the account, application and add-in address. Click **Allow connection** only for the request you just initiated.
4. The add-in connects automatically after approval. Click **Decline** to reject an unexpected request, or **Disconnect** in the add-in to cancel.

This flow matches Outlook's reported email or Teams' reported tenant/user ID against Onboard's authenticated Microsoft session. Host-reported context alone is not proof of identity: approval over the native app's verified local channel is what grants access. Only the requesting add-in, on the same approved origin and holding its private request secret, can collect the one-use approval. No Microsoft permission or cloud-processing permission is added.

Connections have no Onboard time-based expiry. Microsoft token expiry and organizational sign-in policies still apply. Disconnect, service restart, account/settings changes, or reloading an add-in require reconnecting and approving again. Tokens stay in memory. Abandoned approval requests are removed after ten minutes; click Connect to Onboard again if needed. This does not expire an established connection.

**Advanced fallback:** both the add-in and AI Settings retain **Advanced: connect with a code**. A generated pairing code is one-use, has no time-based expiry, and is replaced by the next generated code. The optional Microsoft device sign-in code is different: it belongs only on Microsoft's sign-in page and is used only if you explicitly select the device-code fallback. Never share either code in support messages.

## Administrator setup for the current development build

1. In the organization's correct Entra tenant (commercial or government), open **App registrations → New registration**. Register Onboard for accounts in that organizational directory only. Record the **Directory (tenant) ID** and **Application (client) ID**. These IDs are configuration, not passwords.
2. Under **Authentication → Add a platform → Mobile and desktop applications**, add **`http://localhost/onboard-signin`**. This is the native browser callback, not a Web or SPA platform redirect. Onboard binds a temporary IPv4 loopback-only port before opening the browser; Microsoft ignores the port when matching localhost redirect URIs. No client secret or implicit grant is used. Retain existing approved redirects. **Allow public client flows** is needed only for the optional device-code fallback if your organization permits it. Do not weaken Conditional Access to enable a fallback. See [Microsoft redirect guidance](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url).
3. Under **API permissions → Add a permission → Microsoft Graph → Delegated permissions**, add only the features being tested from the table below. Do not choose Application permissions for this user-scoped design. Have an authorized administrator approve consent where Microsoft or the tenant's consent policy requires it.
4. In **Onboard → AI Settings → Microsoft 365**, leave **Environment** on **Automatic**, enter the two IDs, enable the same read capabilities and **Save settings**. Select **Sign in in browser — CAC or credentials** and complete Microsoft's sign-in with the same account used in Outlook/Teams. MFA and Conditional Access still apply.
5. Start the local service, establish the approved HTTPS setup, deploy the appropriate add-in through the organization's supported route, and connect/approve it as described above. The current policy permits only genuinely public content approved for local processing; existing mailbox access does not change that processing restriction.

| Onboard option | Delegated Graph permissions requested by this build |
| --- | --- |
| Identity (always) | `User.Read` |
| Calendar | `Calendars.Read` |
| Mail | `Mail.Read` |
| Files | `Files.Read` |
| Teams messages | `Chat.Read`, `ChannelMessage.Read.All` |
| Transcripts | `OnlineMeetings.Read`, `OnlineMeetingTranscript.Read.All` |
| Send reviewed emails (optional) | `Mail.Send` |
| Send reviewed Teams messages (optional) | `Chat.Create`, `ChatMessage.Send`, `User.ReadBasic.All` |

This table describes the code's requests, not a guarantee that every resource/API is available in every government cloud or to every user. `Files.Read` does not grant broad access to every shared enterprise document. Transcripts must exist and be accessible through the supported meeting API. Teams and transcript permissions may require administrator consent. Sending is off by default. Optional reviewed-message settings request delegated Mail.Send for email, or Chat.Create, ChatMessage.Send and User.ReadBasic.All for Teams. No application permissions or Mail.ReadWrite are requested. Draft output is never sent automatically.

## Browser / CAC sign-in — native release 0.6.1

Choose your installed browser under **AI Settings → Internet access → Browser**, then **Save settings**. Microsoft sign-in uses that saved selection even when Internet search is disabled. Select **Sign in in browser — CAC or credentials** under Microsoft 365. In the Microsoft/organization page, use certificate/smart-card sign-in when offered, select your CAC certificate and enter its PIN in the browser/OS prompt. Onboard receives an authorization code and exchanges it using PKCE; it never receives the password, CAC PIN or private key. Authentication and API tokens remain in memory and are cleared on disconnect/restart. Expired tokens require sign-in again; there is no silent refresh or attempt to bypass tenant sign-in frequency.

A configured CAC reader, trusted card/certificate chain, browser support and the organization's certificate authentication/federation policy are prerequisites. This flow allows CAC; it cannot require or provision CAC by itself, and is not a device-compliance broker. The tenant determines permitted authentication methods. See [Microsoft's Apple certificate-authentication support](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication-mobile-ios).

The local callback is one-use, checks random state, uses S256 PKCE, times out after ten minutes, records no callback query logs, and closes after completion/cancellation. The temporary HTTP listener is only on loopback; it does not replace or weaken the HTTPS add-in bridge. Browser launch errors stop sign-in; Onboard never silently chooses another browser. The device-code alternative is available only by explicit selection. Live CAC acceptance still requires the actual card, configured tenant and browser.

For `AADSTS50011`, verify the exact desktop redirect above in the **same Entra application/client ID used by Onboard**, not the Teams Actions bot registration. Government customers must configure their own approved registration in the government directory.

## GenAI.mil daily access renewal

No publicly documented GenAI.mil daily-unlock API was identified during the September 28, 2026 implementation. A model instruction such as “unlock access” cannot renew credentials or change an access policy. No automatic unlock is implemented. If your organization supplies an approved documented refresh/re-authorization API, it can receive its own adapter; otherwise complete the required user sign-in in the GenAI portal and retry. An arbitrary HTTP 401/403/503 is not proof of the reported daily lock. Microsoft 365 CAC sign-in and the cloud AI provider's authorization are separate.

## Intended sign-in experience

The desired product flow is: open Onboard in Teams or Outlook, use that host's signed-in Microsoft identity, obtain consent only when required, and approve connection to the local AI service. There should be no separate Onboard account. Repeatedly typing pairing codes is a development connection mechanism, not the intended finished experience.

For Teams, configure an Entra registration and the app manifest for supported host authentication; see [Teams SSO](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview) and [registration requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-register-aad). For Outlook, use Microsoft's supported MSAL nested app authentication on compatible clients, with an explicit supported fallback; see [Outlook authentication guidance](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/faq-nested-app-auth-outlook-legacy-tokens). Cloud and client support must be checked for the actual deployment.

The local connection also needs an authenticated, user-approved binding. A display name, email address or Teams context object is not proof of identity and cannot safely replace the code on its own. The current same-account check is a consistency check; approval in the native app grants the connection. The optional legacy code grants the same limited session.

The organization should configure IDs, approved permissions, host URLs, certificates and deployment once for its users. Users should not have to create their own app registration. This SSO and managed onboarding work remains to be implemented; it is not enabled by the Teams loading correction.

## Local add-in hosting — September 27, 2026

The local-only configuration uses `https://localhost:38473/outlook.html` and `https://localhost:38473/teams.html`, served by the installed Onboard app on this Mac. No Netlify page or handler is required. AI Settings defaults to **Add-in hosting → This Mac — local service**. This mode rejects all hosted origins even if a stale allowlist remains in a settings file.

Deploy `build/addins/outlook.xml` (0.4.1.0) and `build/addins/Onboard-Teams.zip` (0.4.1). Update the existing Teams catalog app; do not create a duplicate. The old 0.3.1 hosted package is retired and must be replaced in the client. It can no longer connect to a service running in local hosting mode.

The localhost certificate must be trusted through the test Mac's approved process; government endpoints need their organization's approved certificate deployment. Do not bypass TLS errors. Local hosting requires Onboard running on the same machine. Teams/Outlook client support, local-network permissions and organizational app policy must be verified on the target endpoint. This is not a claim of government authorization or mobile/remote-client support.

**Organization-managed HTTPS host** remains an explicit alternative in AI Settings, requiring exact organization-approved origins and separately deployed manifests. It has no default vendor. The staged message-menu extension needs an approved reachable handler; it is not activated in the endpoint-only package. The existing Teams tab still offers summary, reply preparation, Graph selection and local Outlook draft transfer after connection is verified.

### OpenAI now; GenAI.mil for the customer

The current OpenAI endpoint, model, API key and processing settings are preserved for public-content development. In **AI Settings → Cloud AI provider**, the customer can enter the documented GenAI.mil endpoint, model/deployment, API format and credential. Changing the endpoint requires a credential for that destination instead of silently reusing the previous provider's key. The current adapters support bearer-authenticated Chat Completions or Azure deployment Chat Completions; a different GenAI.mil API protocol requires an adapter. Do not infer an API URL from the service's website or treat saving settings as a connectivity test. Confirm the actual API using permitted content before presenting it as working.

Microsoft sign-in, proxy settings and the public-content development policy remain separate from provider selection. GenAI.mil selection does not by itself authorize CUI/FCI handling.

## Teams tab loading and HTTPS

Version 0.2.2 adds the required Teams parent domains, completes the SDK readiness handshake, and displays bounded initialization errors. Update the native app/service as well as the Teams package: the manifest ZIP does not contain the service or web page code.

Microsoft states that Teams tabs do not support intranet sites using self-signed certificates. macOS trust established for the Outlook development certificate therefore does not prove Teams compatibility. Production requires a Teams-supported HTTPS deployment with an approved certificate. See [Teams tab prerequisites](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/tab-requirements). This update does not expose the local service publicly or disable certificate checks.

## Outlook retrieval, local review and optional cloud analysis

**Mail.Read** enables read-only retrieval of the selected message, its bounded thread, and an optional related-mail search when the user submits a request. Search uses the signed-in user’s mailbox in the detected Microsoft cloud; it does not grant additional access. [Microsoft documents message search through Graph](https://learn.microsoft.com/en-us/graph/search-query-parameter).

The local model handles requests fitting the 2,048-token profile (1,536 input including instructions and 512 output). Larger results are reduced to complete excerpts for local review, with explicit coverage notes. When add-in cloud assistance is enabled in AI Settings and allowed for the request, locally cited sources can be sent to the configured provider for further analysis. The provider endpoint, account policy, input/output caps, daily request cap, and proxy rules still apply. Source text cannot select another provider or authorize actions. The add-in displays cloud input separately; a failure preserves the local result.

This remains a public-content development implementation. Configuring a government provider does not enable a CUI/FCI production policy. Graph search results and local relevance selection are bounded and may omit relevant or contradictory evidence. Cloud availability requires an actual successful connection to the organization’s documented API endpoint; saving a key alone does not establish it.

## Shared Teams and Outlook behavior

Both add-ins use the same 2,048-token local profile, complete-excerpt selection, source-span checks, and optional locally selected evidence handoff to the configured cloud provider. Teams retrieves the current chat or channel (or explicitly supplied authorized sources); the optional Outlook mailbox search remains specific to Outlook. This is not a search across every Teams conversation.

Both use native-approved, account-matched connections without typing a code. An advanced one-use code fallback remains available without a timer. There is no Onboard session-duration timer. Approval requests, optional codes and connection tokens remain in memory, and disconnect/restart/account-change invalidation, same-account checks, origin binding, replay protection and attempt limits remain. Microsoft sign-in is a separate authorization and may still expire or require reauthentication. Reloading an add-in clears its in-memory connection, so connect once again after fetching an update.


## Reviewed messages between Outlook and Teams

Both add-ins contain **Send a message through Outlook or Teams**. Select the source, enter instructions (for example, summarize conversationally and ask for a meeting), and click **Prepare conversational draft**. Choose Email or Teams, enter the recipient, and edit the body. Email creates a new message, not an in-thread reply. Teams creates or reuses a one-to-one chat with a resolved person inside your organization; group/channel destinations and external guests are not supported by this composer.

Before use, add the relevant **delegated** Microsoft Graph permissions to your existing Entra registration and obtain consent required by your tenant:

| Optional feature | Delegated permissions | AI Settings |
| --- | --- | --- |
| Email sending | Mail.Send | Send reviewed emails |
| Teams direct messages and recipient lookup | Chat.Create, ChatMessage.Send, User.ReadBasic.All | Send reviewed Teams messages |
| Your meeting availability | Calendars.Read (already used for calendar reads) | Calendar |

Enable only the sending features you need, save settings, sign in again, and reconnect the add-in. Existing read permissions for selected mail or Teams sources remain necessary. No redirect URI, client secret or application permission is added by this feature. Microsoft tenant policy may require administrator consent. These endpoints use the discovered Commercial, GCC High or DoD Graph root; live government-tenant acceptance remains unverified.

Use **Add my available meeting times → Check my calendar** to obtain up to three proposals across the next seven days. Set the starting date, time zone, duration and weekday hours. Only your primary calendar is checked; incomplete results fail closed. Busy, tentative, out-of-office, working-elsewhere and unknown statuses block slots. Free/cancelled entries do not. Recipient availability, secondary calendars and holidays without calendar events are not inferred. The time zone and exact dates appear in the message. No meeting is reserved or invitation created.

Confirm that the public message may be shared with the selected recipient, then click **Review message**. The review shows the sender, resolved recipient, subject and complete outgoing text including calendar proposals. Edits require a new review. **Send** is a separate click; prompt text and model output cannot authorize it. Onboard rechecks proposed times before sending and stops if they changed. Availability can still change after this check.

Send requests are bound to the paired session and Microsoft account. A send attempt is consumed once, with a local content-free receipt. Network failures are not automatically retried: if delivery is unconfirmed, check Outlook Sent Items or Teams before preparing another draft. Email API acceptance is not proof of final delivery. Restarting or reconnecting requires a new review.

Microsoft references: [send email](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0), [send Teams chat message](https://learn.microsoft.com/en-us/graph/api/chat-post-messages?view=graph-rest-1.0), [create/reuse one-to-one chat](https://learn.microsoft.com/en-us/graph/api/chat-post?view=graph-rest-1.0), [calendar view](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0).

## If a source reference cannot be verified

Local and cloud grounded requests now ask the model to select supplied numbered evidence references. Onboard attaches the exact corresponding source text and validates it against the retrieved original. The allowed reference list is included in the prompt. A source alias is accepted only when it identifies exactly one supplied excerpt. Unknown or ambiguous evidence IDs and conflicting source/quote fields are rejected. This removes the need for a small model to retype verbatim quotations. Source-reference validation does not establish the semantic correctness or completeness of the generated draft; review is still required.

For older-style responses containing quotations, formatting recovery accepts a complete JSON Markdown block, known original source IDs and an unambiguous whitespace-only quotation difference. Quotes must still pass exact checks against both the supplied excerpt and original source. Changed facts, unknown sources, unseen text and incomplete JSON are rejected. This does not prove the semantic correctness of a draft: review it before sending.

If the model answer fails, the add-in shows copied, verified local source excerpts instead of the unverified answer. When the request and Settings allow cloud assistance, those locally selected sources can receive one cloud analysis attempt, subject to the same provider policy and limits. Invalid cloud output is also withheld. Source excerpts alone cannot enable the message sender; prepare a verified draft first. The Notes area distinguishes formatting failure from quotation mismatch. No private model output is logged for diagnosis. A narrowly scoped structural correction also accepts a complete claims-only JSON object followed by suggestions/unknowns when the model inserted one premature closing brace; field values are unchanged. Incomplete JSON, duplicate fields and prompt placeholders remain rejected.


## Suggest a reply: selected-email scope

**Suggest a reply**, Rewrite, Shorten and Professional tone read only the selected email by default. They do not automatically add other thread messages or run a mailbox search. The Outlook related-email search checkbox starts off; selecting a reply/edit task clears an earlier search selection. You can explicitly check it again to add related-mail candidates, or add specific authorized sources. Related-mail search now requires all chosen topic terms, instead of matching any single term; generic instructions such as “suggest a reply” are not search topics. Search remains bounded to ten candidates and is not exhaustive.

For email context, standard footer blocks and URL-only blocks are omitted; long tracking URLs are removed as separate spans. Remaining excerpts are exact substrings of the retrieved message, with omissions disclosed. No tracking or unsubscribe link is opened. Explicit questions about links, privacy, copyright or footers preserve that material. If only links/footer text remains, Onboard asks you to review the original instead of inventing a reply. Original text remains under Supporting sources. Source titles replace opaque Graph IDs in the answer display.

## Clean replies and automated notices

The response box contains the proposed draft only. Source quotations and full retrieved email text are grouped under collapsed **Supporting sources**, with one heading per source. Missing-information notes stay outside the draft and are not copied into the sending composer. Withheld responses show a short explanation instead of filling the reply box with copied email footers.

**Suggest a reply** recognizes a standalone “Please do not reply to this email” notice in the selected email and recommends against replying. It does not generate a meeting invitation or enable sending that advice as a draft. Choose **Draft follow-up** if you want a separate support message, then select a trusted recipient and review it. The conversational-draft button no longer asks for a meeting by default; available times remain an explicit option. No email links are followed to establish whether a notice is genuine.

The approval and display changes have automated control tests. Actual approval inside Outlook and Teams, and the user's specific email, still require an acceptance check after updating/reopening the apps. These changes do not implement Microsoft host SSO.

## App-first add-ins (September 25, 2026)

Update the native app/service and both add-in packages together. Outlook's manifest is now **0.3.0.0** and requests **ReadWriteItem** so the add-in can insert a reviewed draft into the current composer. Teams' package is **0.3.0**. Existing models and provider settings are reused.

### Outlook

- **Use the opened Outlook item directly** is the default. Office supplies its text; Graph is not used to fetch that item. Attachments are not included automatically.
- **Add the saved thread or calendar details through Graph** and **Also search related emails** are separate, optional choices. They require the corresponding Graph permissions. With neither selected and no additional sources entered, only the opened item is used.
- After generating a response, edit it, select **I reviewed this text**, and choose **Open reply / insert draft in Outlook**. Read mode opens a reply to the sender. Compose mode inserts at the cursor or replaces selected text; it does not replace the entire body. You review the recipient and click Send in Outlook.
- Opening the native reply or inserting text does not require Graph `Mail.Send`. The separate Graph sending section still does. Changing the opened item clears previous output and disables its draft action.

### Teams

- Add Onboard as a tab within the chat or channel where you work. Choose **Load messages from this conversation**, then select the particular message. Graph retrieves authorized message text because Teams tab context supplies identifiers rather than message bodies.
- **Recent conversation** is an explicit broader option, bounded to 30 messages or channel root posts. Channel replies and meeting audio are not included. A personal tab has no current conversation.
- Review the generated text, enter the intended recipient's Teams work sign-in address, select **I reviewed this text**, and choose **Open draft in Teams**. The supported Teams composer API opens a one-to-one draft; sending remains your action inside Teams. This does not create a channel-thread reply or add a right-click message extension.
- Native composing does not use Graph `ChatMessage.Send`; the separate Graph sending workflow still requires its existing permissions. Unsupported host capabilities report an error without silently sending through Graph.

Both integrations still use explicit native Onboard approval, with a code only as an advanced fallback. Microsoft host SSO is not implemented in this update. Existing content policy and cloud-routing controls remain enforced. Missing access, unavailable host APIs, or failed retrieval produce errors rather than sample content.

API references: [Outlook current-item and reply APIs](https://learn.microsoft.com/en-us/javascript/api/outlook/office.messageread?view=outlook-js-preview), [Outlook compose body APIs](https://learn.microsoft.com/en-us/javascript/api/outlook/office.body?view=outlook-js-preview), [Teams chat composer](https://learn.microsoft.com/en-us/javascript/api/@microsoft/teams-js/chat?view=msteams-client-js-latest).

Validation: 220 Python tests, 45 JavaScript tests, and four Rust tests passed. Automated host contracts use explicitly identified test fixtures; runtime behavior uses actual Office/Teams/Graph data. No live email or Teams message was sent. Acceptance inside the user's Outlook and Teams clients remains to be completed.

### Outlook ↔ Teams through Onboard's local draft inbox

Both add-ins now share an account-scoped, in-memory draft queue in the installed Onboard service. This app-to-app path does not call Graph to send email or Teams messages and does not require the optional Graph sending permissions.

1. Generate and edit a response in the source add-in.
2. Expand **Transfer this draft to the other add-in**. Its purpose defaults from the selected task where possible; choose Reply, Summary, Meeting request, Follow-up, or Other. Enter an optional intended recipient and subject/label. Review and confirm, then transfer.
3. Open the other app's Onboard add-in and connect to the same Onboard instance with the same Microsoft account. Expand **Local draft inbox**, refresh, and choose the categorized draft.
4. Review/edit the recipient, subject, and text. Choose **Open draft**. Outlook opens a new email; Teams opens a one-to-one chat draft. Use that application's Send control after your final review.

Onboard is the conduit. The add-ins do not communicate through an unauthenticated browser channel. Only the reviewed draft and its routing fields are queued; original emails, entire chat histories, and tokens are not copied into the queue. No model output can trigger a transfer or send automatically.

The queue holds at most 20 pending drafts on this Mac and is not saved to disk. Closing a source panel leaves its transferred draft available. Explicit source disconnect removes that session's outgoing transfers; sign-out, settings changes, and service restart clear the queue. Opening a destination draft claims its transfer once. If the native composer fails after that claim, the text stays visible in the panel for retry or manual copying. This is temporary draft handoff, not a permanent knowledge store or semantic memory index.

A meeting-request category is organizational metadata: it does not invent availability or book a meeting. Use actual calendar data when including proposed times. Teams channel posting, in-thread email replies from a Teams handoff, automatic opening of the other add-in, and Microsoft host SSO remain outside this update.

Updated combined validation: 235 Python tests, 54 JavaScript tests, and four Rust tests pass. Tests include destination/account isolation, public-content checks, duplicate transfer prevention, single-claim handling, disconnect cleanup, native composer contracts, and edit/review gating. Live in-host handoff and composer acceptance remain pending; no real messages were sent.

## Local AI stopped while summarizing

A guard stop is not a summary. No partial model answer is released. The updated service displays a specific reason and a short diagnostic code, such as `GENERATION_TIMEOUT`, `MEMORY_RESERVE`, `EXISTING_SWAP`, `MODEL_MONITOR_STALE`, or `CLEANUP_UNCONFIRMED`. Follow the action in that message. Do not delete the model or reinstall everything solely because a request stopped.

The most recent supervised run leaves one private `product/integrated/state/last-local-run.json` record in the installed source workspace. It contains the outcome code, cleanup confirmation and numeric runtime measurements; it excludes prompts, email/Teams content, model output, account identifiers and raw exceptions. The next supervised run replaces it. Temporary request contents are still deleted after each request. This record is excluded from published source archives.

The memory, temperature, monitoring, runtime and cleanup limits remain enforced. Native Ask AI may use configured and explicitly permitted cloud assistance after a clean resource or timeout stop. Add-in summarization still requires locally verified source selection before automatic cloud analysis; a failed local request does not silently send the email to a cloud provider.


## Teams message actions — inactive, organization hosting required

The staged message-menu and compose-box code is retained for **Summarize**, **Suggest a reply**, and **Send to Outlook**. Netlify-specific function/deployment files have been removed. An optional organization-managed handler and real bot registration are required; no message content is sent to that handler by the current local-tab package. See [organization-hosted action setup](teams-actions/README.md). The handler currently authenticates commercial Bot Framework requests only; a government authority/tenant integration remains unimplemented and unverified.


## Hybrid tasks and Word — September 28, 2026 (0.5)

See [HYBRID-WORD.md](HYBRID-WORD.md) for the new desktop task mode, Word add-in, Purview metadata inspection and email-to-DOCX attachment workflow. Outlook and Word manifests are **0.5.0.0**; the Teams commercial catalog package remains **0.4.2**. The new source installer builds native app **0.5.0** and retains verified model/runtime files.

These workflows are explicitly enabled: ordinary Ask AI keeps its existing routing, while hybrid tasks use the configured cloud planner and reviewed local tools. The document workflow can send the explicitly selected public source collection directly to the configured cloud provider and batch larger inputs. Earlier local-first add-in source-selection limits describe ordinary Ask AI, not this new, separately selected document workflow.

No additional Graph permission is required for local DOCX generation or native Outlook attachment. Mailbox collection uses delegated `Mail.Read`; document/Teams source reads use their existing configured scopes. Onboard does not request `Mail.ReadWrite` to implement a native attachment. The current label inspection reads exposed metadata; it does not request a Purview catalog scope or grant MIP decryption rights.

The Word pane connects through explicit native approval to the Onboard account shown to the user. Word SSO identity verification is not implemented. Files generated in Word can be attached from the Outlook document tray; feedback text goes through the local draft inbox. The user reviews and sends in Outlook. Only organization-approved PUBLIC labels may be mapped in the development policy; encrypted/unknown labels remain blocked. A customer rollout still needs authorized tenant policy and live acceptance.

## Release 0.6 — saved work, recovery and administrator restrictions

All three add-ins include **Saved work**. Review a generated draft, enter a title, confirm permitted PUBLIC retention and save it. Reconnect the same Microsoft account after restart to reopen it. No new Graph permissions are required. Saved work can also be opened from the native app. There is no automatic content retention or cloud synchronization.

Use **Saved work → Connection and capability status → Check this connection** to see what is ready, configured or still unverified. A configured provider is not described as connected without a real test. See [PRODUCT-STATUS.md](PRODUCT-STATUS.md) and [MANAGED-POLICY.md](MANAGED-POLICY.md).

The native app and add-in packages are versioned 0.6. Updating the local application does not automatically update a tenant catalog or Azure hosting. Use matching release assets; real tenant acceptance remains required.
