# Saved tasks and computer controllers — native 0.7.0

Onboard now has a native **Tasks** screen, a persistent task runner, browser and desktop controls, and per-step review and verification. These are public-content development features for macOS, disabled until configured. They do not turn the 1.7B model into a general-purpose autonomous computer-use model. Deterministic code executes permitted actions; local or configured cloud AI can propose a plan.

## Setup

1. Install the updated native app when you are ready to end the existing Onboard session. Updating source files does not replace an already running app. Save existing work before restarting. The model and verified runtime downloads are reused.
2. In **AI Settings**, enable public local processing and **Enable saved tasks and hybrid tools**. Add specific work folders and exact permitted website hostnames. Save settings.
3. For computer interaction, enable **Computer controllers**, choose approved applications with **Add installed app**, and select your browser in the Internet settings. Save settings. Terminal, security settings, Keychain Access and Onboard itself are excluded targets.
4. Grant the installed Onboard AI app **Accessibility** permission in macOS **System Settings → Privacy & Security → Accessibility**. Onboard does not grant itself permission. No Screen Recording permission is required for this implementation. Complete passwords, CAC/PIN prompts and sign-in yourself.
5. Open **Tasks**. Import a structured JSON plan or describe the work and choose **Generate plan**. Cloud planning uses the configured provider only when you select it and review the outgoing instructions. Local planning uses the retained model and its existing resource/context limits; unsupported model output does not execute.
6. Review and save the plan. Choose **Review and run / resume**. The app presents the remaining plan, consequential actions, inspected windows and required result confirmations. **Pause / stop** cancels further steps; an action already delivered may still finish.

The current signed-in installation was not restarted during this release's development. Accessibility permission and live browser/desktop acceptance remain installation-time checks.

## Controllers and limits

| Component | Available behavior |
|---|---|
| Task runner | Save/import plans; run or resume verified checkpoints; stop; explicitly resolve interrupted actions; propose a revised remaining plan; export a readable Markdown task record. No automatic startup execution. |
| File/document tools | Search specific approved folders, read supported text/DOCX files, create new TXT/Markdown/DOCX files, and call bounded local extraction. Existing files are not overwritten. Existing DOCX sensitivity checks still apply. |
| Browser | Open an approved HTTPS address in the selected installed browser; inspect its accessible window; act on inspected controls; type, click, press supported keys or scroll after review. Uses the browser's existing signed-in session. |
| Desktop | Open allowlisted installed apps; inspect their accessible window; press controls, set text, click controls or reviewed window-relative coordinates, scroll, and use Return/Tab/Escape/arrows/Backspace. |
| Verification | Fresh window fingerprint, foreground-app checks, mouse target ownership check, expiring task-bound observations and one-use native action tickets. A delivered input alone is not verified business success. |
| Cloud assistance | Explicit planning or repair with reviewed instructions/evidence. Existing live hybrid mode can inspect, ask the cloud for the next bounded action, review it, and execute it. Configured provider policy and request limits remain enforced. |

Browser inspection requires the browser to expose the current page URL through macOS Accessibility; it fails if the URL is missing or outside approved hosts. Known browser apps cannot bypass these checks through desktop inspection. Browser accessibility support varies; this is not a DOM/extension controller or a visual screenshot agent. A page's redirect or button can navigate before the post-action check detects an unapproved destination; hostname checking is not a network firewall. Browser traffic uses the browser/OS network configuration, not Onboard's HTTP-client proxy setting.

Observations are bounded and may be partial. Controls omitted from the observation cannot be targeted by ID. `name:Save` can target an exact, unique observed title or description; ambiguous matches stop for a fresh selection. Moving or changing a window can invalidate the pending action. Protected password values are omitted; actions stop if a protected credential field is observed. This is not a complete detector of every security-sensitive UI or a Purview enforcement boundary for arbitrary screen content. Use only permitted PUBLIC windows and review each action.

No arbitrary terminal commands, modifier-key shortcuts, file deletion, automatic credential entry, background permission changes, unattended sending or automatic rollback are added. Windows controllers, vision/OCR, complete browser coverage and customer government acceptance remain open.

## Offline execution and recovery

An imported/reviewed plan containing local file or desktop steps does not need cloud AI. Local extraction needs the installed model and passes the existing memory/runtime guards. Websites, Graph queries and cloud planning still require connectivity. An unavailable local model stops the saved plan for review; it does not silently export data or replace its instructions.

Each step writes durable intent before acting, then writes its result and checkpoint after verification. If the app/service stops between those writes, the task is marked **needs review**. Inspect the actual destination, then choose **I verified it completed** or **Allow reviewed retry**. Onboard never automatically replays an uncertain action. A manually completed step has a confirmation record, not invented tool output; later references to missing output fail rather than fabricate it.

Plans have 1–30 steps. Each run has the existing 30-minute lifecycle limit and each review expires after 10 minutes. Resume is explicit. These limits do not expire add-in connection codes.

Records live under the service's private `state/tasks` folder, encrypted with native AES-256-GCM using the existing user Keychain key and a task/OS-user/state-location binding. Up to 25 records and 2 MB per record are retained. They persist until removed or archived by the owner; no automatic retention expiry or backup exclusion is claimed. To archive, stop that task and move its `.sealed` file out of `state/tasks`; restore it to the same installation's folder to reopen. A readable export contains the plan and captured results, is deliberately unencrypted, and is created only at the location you select.

Local-only plans belong to the Mac user and can reopen without Microsoft sign-in. Plans using Graph are additionally bound to the Microsoft account and cloud; other accounts cannot list/read them through Onboard. Stored label metadata is checked again on reopening, but saved results are historical evidence, not proof of continuing source access or current facts. A new read/query is needed to refresh them. Generic desktop observations cannot reliably discover tenant labels. Organization policy can disable tasks and saved work.

## Plan format

Every step has exactly `tool`, `arguments`, and `verify`. Verification is either `{"manual":true}`, or a result `path` plus `equals`/`contains`. Computer actions must check an `after.*` observation or require manual confirmation. A whole argument can reference prior results with `@step:0.text`; forward references and arbitrary code are rejected.

For example, this plan reads **your existing** small `notes.md` in approved folder 0, summarizes it locally, and creates a new file after review. It is an example schema, not a bundled document or fabricated result. Local extraction accepts at most 4,000 source characters. Rename the paths for your actual work; creation fails if the destination already exists.

```json
{
  "title": "Summarize my local notes",
  "steps": [
    {"tool":"file_read","arguments":{"root":0,"path":"notes.md"},"verify":{"manual":true}},
    {"tool":"local_extract","arguments":{"text":"@step:0.text","instruction":"Summarize the main points; identify uncertainty."},"verify":{"manual":true}},
    {"tool":"file_create","arguments":{"root":0,"path":"notes-summary.md","title":"Notes summary","text":"@step:1.text"},"verify":{"manual":true}}
  ]
}
```

An uploaded document or website cannot grant permission or run instructions by itself. Plans must pass tool/schema checks and the current settings, policy, application/domain and user-review checks.

## Release verification

Automated checks cover offline file execution, verified-step resume, interrupted-step blocking, repair references, account isolation, malformed plans, denied/expired/reused tickets and snapshots, target restrictions and review refusal. Native AES-GCM checks separately cover round-trip, altered ciphertext, wrong key and context binding. A successful build or fixture test is not live UI acceptance. Native computer-use verification was unavailable in this development session; test approved app opening, harmless text entry, browser observation, cancellation and stale-window rejection after installing and granting Accessibility access.
