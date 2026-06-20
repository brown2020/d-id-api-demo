# Agent Report

## Agent

Name: Codex

## Scope

Read-only source inspection for security, race, architecture, lean-code, package, diagnostics, and validation gaps. No source code changed in this phase.

## Inputs

Baseline report, `spec.md`, `AGENTS.md`, `src/actions/generateDIDVideo.ts`, `src/actions/generateVideo.ts`, `src/actions/retrieveDIDVideo.ts`, `src/zustand/useProfileStore.ts`, `firestore.rules`, `src/libs/api-auth.ts`, diagnostic API routes, package metadata, and source searches.

## Branch and Push

- Branch: `dev`
- Upstream: `origin/dev`
- Commit: pending checkpoint commit
- Pushed to: pending checkpoint push
- Sync status: clean and synced before findings report edits.

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: produce an evidence-backed prioritized backlog and scorecard.
- Verify gate: every finding has severity, evidence, owned files, proposed fix, and verification method.
- Stop condition: backlog prioritized and highest-priority executable task is clear.
- Attempt: 1/1
- Result: backlog ready; first executable task is F-001/T-004.

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: `920c11e`
- Next action: commit/push findings, then execute F-001/T-004.
- Blockers: None.

## Commands Run

```text
rg "console\\.(log|warn|error)|Authorization|authHeader|x-api-key-external|finalElevenlabsApiKey|finalApiKey|Basic Auth|API Key" src/actions/generateDIDVideo.ts -n
nl -ba src/actions/generateDIDVideo.ts
nl -ba src/zustand/useProfileStore.ts
nl -ba src/actions/retrieveDIDVideo.ts
nl -ba src/app/api/avatar-ids/route.ts
nl -ba src/app/api/video-ids/route.ts
nl -ba src/app/api/debug/route.ts
nl -ba src/app/api/test-image-access/route.ts
nl -ba src/libs/api-auth.ts
nl -ba firestore.rules
nl -ba src/actions/generateVideo.ts
rg "TODO|FIXME|XXX|console\\.log\\(|debug|temporary|deprecated|Clerk|saveNgrokUrl" src -n
rg "useCredits\\(|addCredits\\(|credits" src/components src/actions -n
rg "from \\\"moment\\\"|from 'moment'|moment\\(" src -n
rg "react-select|react-spinners|moment|uuid|sharp|@hookform/error-message|axios" src package.json -n
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P1 | Security | Open | Secret handling/logging | D-ID generation and profile loading emit secret-bearing or near-secret data to logs, including full Axios request configs with `authorization` and ElevenLabs external key headers, API-key prefixes, Basic-auth prefixes, and full profile objects. | `src/actions/generateDIDVideo.ts:61`, `src/actions/generateDIDVideo.ts:76`, `src/actions/generateDIDVideo.ts:550`, `src/actions/generateDIDVideo.ts:558`, `src/actions/generateDIDVideo.ts:607`, `src/zustand/useProfileStore.ts:84`; related signed URL log at `src/actions/retrieveDIDVideo.ts:351`. | Credentials can leak to Vercel/server logs or browser console; signed URLs with long expiry can leak into logs. | Small/medium | `rg` confirms no full auth config/profile/signed URL logging; `yarn lint`, `yarn typecheck`, `yarn test`. | Execute first as T-004. |
| F-002 | P1 | Bug | Open | Credits/profile hydration | Existing profile credits below 100 are coerced to 1000 and the existing profile is written back from the client; Firestore rules block credit changes, so low-credit users can fail profile hydration or appear incorrectly topped up locally. | `src/zustand/useProfileStore.ts:56`, `src/zustand/useProfileStore.ts:77`, `src/zustand/useProfileStore.ts:102`, `firestore.rules:90`. | Breaks billing trust and may prevent profile load for users with low/zero credits. | Small | Add/adjust pure helper tests if practical; otherwise `yarn lint`, `yarn typecheck`, `yarn test`. | Execute after F-001 or in same store-safe batch if scoped. |
| F-003 | P2 | Documentation | Open | Repo guidance/spec drift | Current docs still describe diagnostic endpoints as unauthenticated/open, but code now guards ID routes with `requireApiSession` and debug/image-test routes with `requireNonProduction`. | `AGENTS.md` caution table, `spec.md` known limitation 7, `src/app/api/avatar-ids/route.ts:8`, `src/app/api/video-ids/route.ts:8`, `src/app/api/debug/route.ts:7`, `src/libs/api-auth.ts:11`. | Future agents may chase stale security work or misjudge production exposure. | Small | Docs diff plus `yarn lint`. | Fix with F-001/F-002 docs or next docs checkpoint. |
| F-004 | P2 | Package update | Open | Dependency risk | GitHub push reports 53 vulnerability alerts on the default branch. Exact packages require audit/dependabot evidence before updating. | GitHub push output after checkpoints; package phase queued. | Known dependency vulnerabilities may affect production demo. | Medium | `yarn audit`/GitHub Dependabot evidence, safe patch/minor update batch, full validation. | Handle in package cleanup phase, defer risky majors. |
| F-005 | P2 | Architecture/Lean code | Open | D-ID generation action cohesion | `generateDIDVideo.ts` mixes auth-header normalization, image reachability checks, verbose diagnostics, D-ID auth preflight, POST request, error translation, and error reporting in one large server action. | `src/actions/generateDIDVideo.ts` is 740 lines; code paths at `src/actions/generateDIDVideo.ts:31`, `src/actions/generateDIDVideo.ts:163`, `src/actions/generateDIDVideo.ts:543`, `src/actions/generateDIDVideo.ts:646`. | Harder to reason about sensitive logging and request behavior; increases regression risk. | Medium | Start with logging/bug fixes; defer extraction unless tests or clear seams make it safe. | Defer broad refactor unless needed by F-001. |
| F-006 | P3 | Test gap | Open | Store/payment generation behavior | Helper tests pass, but profile credit hydration and D-ID request construction are not covered by unit tests. | `vitest.config.ts` includes `src/**/*.test.ts`; tests currently under `src/libs/*.test.ts`; no store/action tests found. | Bugs in billing/profile/server action code rely on manual review. | Medium | Add focused pure helper tests when extracting logic or fixing credits. | Opportunistic if F-002 extracts a pure helper. |

## Changes Made

- No source changes.
- Updated findings report and queue/ledger only.

## Verification

Read-only search evidence gathered. Lint is pending as the pre-push gate for the findings checkpoint.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | Client components did not import `firebaseAdmin` or server `protect()` in search results; Admin imports are confined to API routes/server actions. | None |
| Module cohesion | Fail | `src/actions/generateDIDVideo.ts` combines several responsibilities and contains the highest-risk secret logging. | Fix F-001 first; defer broad extraction |
| Public surface area | Watch | Diagnostic endpoints are guarded; public image proxy routes remain intentionally public for D-ID. | Fix docs drift F-003 |
| Data and side-effect flow | Fail | `useProfileStore` writes merged profile data from the client and can alter/read-write `credits`; rules make credits server-only. | Fix F-002 |
| Async/cache/resource lifecycle | Watch | Webhook/polling race fix exists; no new confirmed race found in this pass. | Reassess after fixes |
| Duplication and dead code | Watch | Deprecated `saveNgrokUrl` remains intentionally documented; no deletion proof yet. | Defer |
| Dependency lean-ness | Watch | GitHub vulnerability alerts exist; exact package evidence pending. | Package phase |
| Testability | Watch | Existing helper tests pass; store/action risk areas lack tests. | Queue F-006 |

## Quality Gate

- Command: pending `yarn lint`
- Result: pending
- Notes: report-only phase; lint remains selected pre-push gate.

## Commit-Push Checkpoint

- Status inspected: pending
- Diff checked: pending
- Files staged: pending
- Dry-run push: pending
- Push: pending
- Post-push sync: pending

## Stabilization

- Cycle: N/A
- Completion criteria status: not in stabilization phase
- Remaining blockers: None.

## Risks

Known risks or uncertainties: F-004 needs package audit evidence before dependency edits. F-005 is intentionally deferred behind safer behavior-preserving fixes.

## Open Questions

- None.

## Recommended Next Step

Commit/push findings, then execute F-001/T-004 secret-log hardening.
