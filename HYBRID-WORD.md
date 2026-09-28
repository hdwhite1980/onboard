# Hybrid tasks, Word and Purview metadata — development release 0.5

This build adds cloud planning with local tools, a Word task pane, and email-to-Word-document workflows. It uses actual selected files and Microsoft data when configured. Tests use isolated fixtures; they are not evidence of a working customer tenant or GenAI.mil connection.

## Desktop hybrid tasks

1. Update with `bash Setup.command`, then quit and reopen Onboard AI.
2. In **AI Settings**, configure your existing cloud provider. Enable public local and cloud processing.
3. Under **Hybrid tasks and label policy**, enable hybrid tasks, add specific work folders and exact website hostnames, and save. The entire home folder and disk root are not accepted.
4. In **Ask AI**, select **Work on a task**, enter the task, permit cloud planning, and confirm the task is PUBLIC.
5. Review each collected tool result before it goes to the configured provider. File creation and browser opening also require an exact-action review. Decline or Cancel stops further work.

The provider returns one JSON plan step at a time. The local controller validates the tool name and arguments; the provider cannot execute arbitrary commands. The tool set includes filename search, bounded text/DOCX reads, public HTTPS page reads, opening an approved URL in the chosen browser, delegated mailbox search, specific Microsoft source retrieval, optional short extraction through the retained 1.7B model, and creation of new TXT/Markdown/DOCX files. Existing files are never overwritten.

Website reads do not operate authenticated browser tabs, click page controls, submit forms, or inspect the user's browser history. Browser opening does not imply that Onboard read the page. Public page requests honor the configured/manual proxy, reject redirects and private network destinations, and surface connection failures. With a configured proxy, that proxy controls remote DNS resolution and destination enforcement. No automatic proxy bypass is attempted.

Tasks stop after the configured 1–12 planning steps, 30 minutes, cancellation, a settings/account change, a provider limit, or an unsupported action. Individual approval prompts expire after 10 minutes. These task limits do not reinstate connection-code expiry. Credentials remain in Keychain. Task prompts and gathered results remain in service memory and are not added to content logs.

GenAI capability is an implementation assumption. A customer endpoint must support the selected API adapter and reliable JSON planning, or receive a separately implemented adapter. No native function-calling API is required. This release does not claim verified GenAI.mil interoperability or government approval.

## Word task pane

Use the generated **word.xml** manifest for local HTTPS, or **word-hosted.xml** for the commercial Azure test host. The local Onboard service and its trusted localhost certificate are required in either case. Hosted pages alone do not run the local model.

For a development sideload on Mac, place the chosen manifest in:

```text
~/Library/Containers/com.microsoft.Word/Data/Documents/wef/
```

Create that directory if needed, restart Word, and select the add-in under **Insert → Add-ins → My Add-ins** (the exact menu varies by Word version). For managed deployment, have the tenant administrator deploy the manifest through the organization's approved Office add-in process. This release prepares the manifests; it does not automatically install a new Word add-in in the tenant.

Connect from the Word pane and approve the request in the native Onboard app. Word's stable document APIs do not prove the signed-in Office account. Approval explicitly binds that pane to the Onboard account shown in the native window; this is not Word SSO. No connection code is required.

Choose **Inspect current document** to copy its compressed DOCX to the local service for bounded text and label-metadata inspection. No content is sent to cloud AI at inspection. Confirm classification and choose whether to use the configured cloud provider before asking AI.

Available actions: summarize, questions about the document, rewrite, shorten, tone, outline, review for improvements, organize your thoughts, draft an email expressing your thoughts, and create documentation. Edit and review the result, then add it to the document end or replace the selection captured during inspection. A changed document or selection requires a new inspection; existing document labels are not modified. The add-in does not perform tracked-change acceptance, full visual layout analysis, image interpretation or every Microsoft Copilot feature.

The stable compressed-file API supports desktop Word on Mac/Windows, but not Word on the web. Unsupported or protected files fail visibly. This release reads main-body/table text only; headers, footers, comments, revisions, embedded objects and images are not fully represented. DOCX input is capped at 4 MB and 120,000 extracted characters. Macro-enabled documents are rejected.

## Email → Word → email attachment

In Outlook, open the email and Onboard pane. Under **Turn emails into a Word document**:

1. Choose selected items, matching mailbox messages, or the most recent mailbox messages. Enter specific search words for matching messages and your documentation instructions above.
2. Confirm PUBLIC content and explicitly choose cloud drafting if needed. Additional mailbox reads require the existing delegated `Mail.Read` configuration.
3. Choose **Draft documentation**. The collection limit is 200 messages over four pages, with explicit coverage notes. This is not an exhaustive mailbox export. Large input can use up to 24 bounded evidence-analysis batches and one final drafting call, subject to configured provider/daily limits. Over-limit collections fail visibly and need a narrower query.
4. Review/edit the draft, give it a title, and choose **Create Word file**. The generated document includes a title, paragraphs and Markdown-style headings; it is a new DOCX, not a conversion preserving the original layout or protection.
5. In an Outlook reply/new-email compose window, open Onboard, refresh the **Document tray**, select the created document, and choose **Attach selected document to this email**. Review recipients, body and attachment, then send using Outlook.

The native Outlook attachment API needs Mailbox 1.8 support. An unsupported client requires downloading and attaching the file manually. No public download URL, extra Graph write permission, or automatic email send is introduced.

Word's **Create Word file** places a reviewed public document in the same local tray. **Transfer reviewed draft to Outlook** transfers your reviewed feedback/email text to Outlook's existing local draft inbox. Open it there, confirm the recipient and text, and send in Outlook. The tray and drafts are scoped to the current Onboard Microsoft account and cleared on restart, disconnect or settings/account changes. They are not a cloud file-sharing service.

## Purview label handling

Supported inspection paths:

- Outlook compose: Office sensitivity-label API where supported.
- Outlook read and Graph mail: `MSIP_Labels` internet-header metadata where exposed.
- DOCX: `MSIP_Label_*` custom properties and Microsoft's `mipLabelMetadata` label parts.

The label's tenant and GUID matter; a display name such as "Public" never grants permission. An unreadable, malformed or unsupported label blocks AI processing/export. Active labels block processing unless their exact `tenant-GUID:label-GUID` pair is explicitly mapped to organization-approved PUBLIC content in AI Settings. Encryption metadata blocks even a mapped label. This is a development policy setting, not centrally signed Purview enforcement or independent rights verification.

An absent supported label is reported as unlabeled, not automatically PUBLIC. The user's public-content confirmation remains necessary. No label downgrade, encryption removal, protected-file decryption or external-recipient permission is performed. Created files do not automatically inherit or apply labels. A rights-aware MIP integration, label-policy provisioning and tenant validation remain necessary before handling protected government data. Internal, FCI, CUI and unknown content remain outside this development build's enabled policy.

## Microsoft references checked for implementation

- [Word sensitivity-label API — preview only](https://learn.microsoft.com/en-us/javascript/api/word/word.sensitivitylabel?view=word-js-preview)
- [Office compressed document API and platform support](https://learn.microsoft.com/en-us/javascript/api/office/office.document?view=office-js)
- [Outlook sensitivity-label support and prerequisites](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/sensitivity-label)
- [Microsoft label metadata schema](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-offcrypto/b75503d0-ada1-4eca-adc1-adeb643ab813)
- [Outlook compose attachment API](https://learn.microsoft.com/en-us/javascript/api/outlook/office.messagecompose?view=outlook-js-preview)

Automated coverage includes planner schema rejection, folder traversal/symlink/FIFO guards, non-overwrite creation, approval binding and cancellation, cloud egress review, API budgets, private-address rejection, label/protection blocking, DOCX generation, account-bound document trays, mailbox pagination, Word stale-document/selection rejection and Outlook compose-only attachment. Live Word insertion/attachment, real Purview tenant policies and GenAI.mil still require acceptance testing in the configured environment. No real email or Teams message was sent while building this release.
