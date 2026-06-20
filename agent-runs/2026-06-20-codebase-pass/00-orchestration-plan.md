# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/d-id-api-demo`
- Branch: `dev`
- Work mode: `full`
- Run folder: `agent-runs/2026-06-20-codebase-pass`
- Verifiable gates: Git remote read, fast-forward sync, dry-run push, `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, and targeted source searches.
- Human-decision blockers: production credentials, Firebase/Vercel console changes, Firestore rules deploys, and new product roadmap priorities.
- Resume policy: resume from `run-state.md`, `task-queue.md`, latest phase report, and Git state; push any validated local phase commit before new edits.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint, typecheck, tests, build, and dependency diagnostics classified | Baseline clean or failures have reproduction and ownership |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Highest-priority confirmed issue fixed with targeted checks and quality gate | Task done, deferred, or blocked with evidence |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe package/dead-code batch verified without lockfile churn | Cleanup pushed or deferred with evidence |
| Review | Judge Loop | PASS or actionable findings queued | Review report pushed |
| Stabilization Loop | Stabilization Loop, Judge Loop | No P0/P1, introduced regressions, confirmed races, or high-confidence architecture failures remain | Completion criteria pass or real blocker recorded |
| Integrator | Final Completion Gate | Branch clean/synced and final report pushed | Workflow complete or blocked |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-20-codebase-pass/*`, `AGENTS.md`, `spec.md`, `README.md` | Startup planning, resume state, and evidence-backed docs drift fixes |
| T-002 | `agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md` | Baseline validation only; no source edits |
| T-003 | `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Evidence-backed bug/risk/dead-code/package backlog |
| T-004 | Source files named by the highest-priority backlog item plus execution report | Small verified bug or reliability fix |
| T-005 | Package/dead-code files named by backlog plus cleanup report | Safe cleanup only; defer risky major updates |
| T-006 | Review, stabilization, final reports | Judge gate and final completion ledger |
