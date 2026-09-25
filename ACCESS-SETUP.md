# Onboard Microsoft 365 access setup

Onboard should use the signed-in user's existing Microsoft 365 access. Microsoft Graph still requires an Entra application identity and consent for the permissions Onboard requests. With **delegated permissions**, effective access is limited by both the permissions approved for Onboard and what the signed-in user can access. An existing Teams or Outlook session alone does not authorize an arbitrary add-in to read the user's mailbox, files or conversations. See [Microsoft's permissions explanation](https://learn.microsoft.com/en-us/graph/permissions-overview).

## What the current build actually supports

This build uses a separate Microsoft device-code sign-in in the native app and a temporary code to connect each add-in to the local AI service. It does **not** yet implement Teams or Outlook single sign-on (SSO).

**AI Settings → Microsoft 365 → Environment → Automatic** now discovers the configured tenant's environment from Microsoft's HTTPS OpenID metadata before sign-in. Commercial, GCC, GCC High and DoD are supported routing choices. The **Detect tenant environment** button checks the entered tenant ID without signing in or reading organizational content. Save the tenant/client IDs and permissions before selecting **Sign in with Microsoft**; detection also runs automatically during that sign-in.

| Detected environment | Sign-in authority | Graph endpoint |
| --- | --- | --- |
| Commercial / GCC | `login.microsoftonline.com` | `graph.microsoft.com` |
| GCC High | `login.microsoftonline.us` | `graph.microsoft.us` |
| DoD | `login.microsoftonline.us` | `dod-graph.microsoft.us` |

Endpoint mapping follows [Microsoft's national cloud deployments](https://learn.microsoft.com/en-us/graph/deployments). Government discovery is confirmed at the government authority before a device-code/token request. Discovery checks `msgraph_host`, region/subregion, tenant-specific issuer and token endpoint. Region/subregion interpretation also appears in [CISA's tenant environment checks](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/Modules/Providers/ExportPowerPlatformProvider.psm1). Unexpected or conflicting metadata stops sign-in; it never guesses from an email suffix or retries a blocked request through another cloud.

Automatic discovery initially sends the configured tenant ID to Microsoft's public metadata endpoint; it sends no credentials or organizational content. Organizations requiring government-only discovery can select GCC High or DoD explicitly; that selection is verified against government metadata. Explicit selections cannot override a conflicting response. Network/proxy failures stop the check and are displayed.

Only one tenant/account is active at a time. After changing the tenant/client IDs, save and sign in again; previous tokens and paired sessions are cleared. The app chooses endpoints automatically, but does not discover the user's account from Teams, create registrations, transfer consent, or make a commercial app registration valid in government clouds. An approved app ID in the correct environment is still required.

Routing and rejection paths have automated control tests. Live sign-in, delegated Graph retrieval, and government-cloud acceptance require actual approved tenant/app configuration and remain unverified. No successful sign-in or enterprise content was fabricated.

## The two codes are different

| Prompt | Purpose | Where it is used |
| --- | --- | --- |
| Microsoft sign-in code | Authorizes Onboard as the signed-in Microsoft user through the current device-code flow | The Microsoft sign-in page opened from AI Settings |
| One-use pairing code | Connects a particular add-in to the same user's local Onboard service | The Onboard panel inside Outlook or Teams |

The pairing code is generated in **Onboard → AI Settings → Outlook and Teams connections** after Microsoft sign-in. Choose Outlook or Teams, then **Create one-use pairing code**. Enter it into that application's Onboard panel when ready. It has no time-based expiry and is consumed on use. Creating another code replaces the previous unused code. The resulting Onboard connection has no time-based expiry; disconnect, service restart or account/configuration changes invalidate it. Microsoft token expiry and organizational sign-in policies still apply. Reloading the tab clears its in-memory connection token. It is not a license key and it grants no new Microsoft permissions. Do not share either code in support messages.

## Administrator setup for the current development build

1. In the organization's correct Entra tenant (commercial or government), open **App registrations → New registration**. Register Onboard for accounts in that organizational directory only. Record the **Directory (tenant) ID** and **Application (client) ID**. These IDs are configuration, not passwords.
2. Under **Authentication → Advanced settings**, enable **Allow public client flows** only if the organization authorizes device-code sign-in for this development app. This flow has no redirect callback and uses no client secret. If organizational policy blocks device code, an approved supported sign-in adapter is required; do not weaken that policy. See [Microsoft's device-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code).
3. Under **API permissions → Add a permission → Microsoft Graph → Delegated permissions**, add only the features being tested from the table below. Do not choose Application permissions for this user-scoped design. Have an authorized administrator approve consent where Microsoft or the tenant's consent policy requires it.
4. In **Onboard → AI Settings → Microsoft 365**, leave **Environment** on **Automatic**, enter the two IDs, enable the same read capabilities and **Save settings**. Select **Sign in with Microsoft** and complete Microsoft's sign-in with the same account used in Outlook/Teams. MFA and Conditional Access still apply.
5. Start the local service, establish the approved HTTPS setup, deploy the appropriate add-in through the organization's supported route, and pair it as described above. The current policy permits only genuinely public content approved for local processing; existing mailbox access does not change that processing restriction.

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

## Intended sign-in experience

The desired product flow is: open Onboard in Teams or Outlook, use that host's signed-in Microsoft identity, obtain consent only when required, and approve connection to the local AI service. There should be no separate Onboard account. Repeatedly typing pairing codes is a development connection mechanism, not the intended finished experience.

For Teams, configure an Entra registration and the app manifest for supported host authentication; see [Teams SSO](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview) and [registration requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-register-aad). For Outlook, use Microsoft's supported MSAL nested app authentication on compatible clients, with an explicit supported fallback; see [Outlook authentication guidance](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/faq-nested-app-auth-outlook-legacy-tokens). Cloud and client support must be checked for the actual deployment.

The local connection also needs an authenticated, user-approved binding. A display name, email address or Teams context object is not proof of identity and cannot safely replace the code on its own. The current same-account check is only a consistency check after the local pairing authorization.

The organization should configure IDs, approved permissions, host URLs, certificates and deployment once for its users. Users should not have to create their own app registration. This SSO and managed onboarding work remains to be implemented; it is not enabled by the Teams loading correction.

## Teams tab loading and HTTPS

Version 0.2.2 adds the required Teams parent domains, completes the SDK readiness handshake, and displays bounded initialization errors. Update the native app/service as well as the Teams package: the manifest ZIP does not contain the service or web page code.

Microsoft states that Teams tabs do not support intranet sites using self-signed certificates. macOS trust established for the Outlook development certificate therefore does not prove Teams compatibility. Production requires a Teams-supported HTTPS deployment with an approved certificate. See [Teams tab prerequisites](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/tab-requirements). This update does not expose the local service publicly or disable certificate checks.

## Outlook retrieval, local review and optional cloud analysis

**Mail.Read** enables read-only retrieval of the selected message, its bounded thread, and an optional related-mail search when the user submits a request. Search uses the signed-in user’s mailbox in the detected Microsoft cloud; it does not grant additional access. [Microsoft documents message search through Graph](https://learn.microsoft.com/en-us/graph/search-query-parameter).

The local model handles requests fitting the 2,048-token profile (1,536 input including instructions and 512 output). Larger results are reduced to complete excerpts for local review, with explicit coverage notes. When add-in cloud assistance is enabled in AI Settings and allowed for the request, locally cited sources can be sent to the configured provider for further analysis. The provider endpoint, account policy, input/output caps, daily request cap, and proxy rules still apply. Source text cannot select another provider or authorize actions. The add-in displays cloud input separately; a failure preserves the local result.

This remains a public-content development implementation. Configuring a government provider does not enable a CUI/FCI production policy. Graph search results and local relevance selection are bounded and may omit relevant or contradictory evidence. Cloud availability requires an actual successful connection to the organization’s documented API endpoint; saving a key alone does not establish it.

## Shared Teams and Outlook behavior

Both add-ins use the same 2,048-token local profile, complete-excerpt selection, source-span checks, and optional locally selected evidence handoff to the configured cloud provider. Teams retrieves the current chat or channel (or explicitly supplied authorized sources); the optional Outlook mailbox search remains specific to Outlook. This is not a search across every Teams conversation.

Both use a one-use connection code with no timer, and no Onboard session-duration timer. Codes and connection tokens remain in memory, and disconnect/restart/account-change invalidation, same-account checks, origin binding, replay protection and attempt limits remain. Microsoft sign-in is a separate authorization and may still expire or require reauthentication. Reloading an add-in clears its in-memory connection, so connect once again after fetching an update.


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
