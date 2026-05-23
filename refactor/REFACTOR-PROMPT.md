# Refactor Prompt — Learn-First, Performance, Maintainability, Bug-Fix, Deduplication

Copy and paste the prompt block below into a new Claude Code / Cowork session that has the same plugins, skills, and MCP servers installed (see `TOOLING-INVENTORY.md`).

Fill in the placeholders at the top before sending:
- `<<TARGET_PATH>>` — the folder or file to refactor (e.g. `./src`)
- `<<LANGUAGE_STACK>>` — main language(s) / framework(s) (e.g. `TypeScript + Next.js 14 + Prisma`)
- `<<RUN_COMMAND>>` — how to start the app (e.g. `npm run dev`)
- `<<TEST_COMMAND>>` — how to run tests (e.g. `npm test`)
- `<<PERF_HOTSPOTS>>` — optional: any flows the user already suspects are slow (e.g. "checkout, dashboard load")

---

## THE PROMPT

```
You are doing a deep, evidence-based refactor of <<TARGET_PATH>> (<<LANGUAGE_STACK>>).
Run command: <<RUN_COMMAND>>
Test command: <<TEST_COMMAND>>
Suspected hotspots: <<PERF_HOTSPOTS>>

GOALS (in priority order)
1. LEARN the codebase deeply before changing a single line. You will be evaluated on the quality of your understanding, not on how fast you start editing.
2. Fix real bugs — runtime errors, race conditions, off-by-one, logic errors, type errors, unhandled rejections, memory leaks, resource leaks (unclosed handles, sockets, listeners), incorrect error handling.
3. Remove duplicate code that creates bug surface area — same logic copy-pasted, drifting variants, overlapping helpers, parallel class hierarchies, copy-pasted SQL/regex. Consolidate into one well-tested source of truth.
4. Make the code run smoothly without delay — eliminate N+1 queries, blocking I/O on the hot path, unnecessary re-renders, sync work that should be async, redundant network calls, missing memoization/caching, oversized bundles, unindexed lookups, busy loops, accidental quadratic complexity.
5. Make the code renewable (maintainable, reusable, extensible) — clear module boundaries, single responsibility, no hidden coupling, named constants instead of magic values, typed interfaces, documented public APIs, dependency-injected side effects, explicit error types.

HARD RULES (non-negotiable)
- Never edit code you have not read. If you are about to touch a file or module you have not opened in this session, stop and read it first.
- Never claim a step is done without evidence. Use the `verification-before-completion` skill (Superpowers) as a gate on every task you mark complete. Evidence = test pass output, benchmark numbers, diagnostic output, or a quoted diff — never "looks right."
- Never change public behavior unless you are fixing a bug. Any intentional behavior change must be listed in the final report under "BEHAVIOR CHANGES" with reason.
- Every bug fix follows reproduce → minimise → hypothesise → fix → regression-test. Use `systematic-debugging` (Superpowers), `gsd-debug`, or context-mode `diagnose`.
- Every deduplication follows: pin behavior with tests on BOTH sites → prove semantic equality → collapse → delete dead copy in the same commit. Never leave the tree holding both copies.
- Every perf claim must be measured, not asserted. Capture a baseline number before the change and an after number after the change.
- No new dependencies without explicit justification (size, security, maintenance, license) and user confirmation.
- For version-specific library questions, query Context7 MCP. Do not rely on training knowledge for API shapes — APIs change.
- If at any point you are guessing, stop and read code, run a probe, or ask the user.

================================================================
WORKFLOW — execute phases strictly in order. Do not skip ahead.
================================================================

----------------------------------------------------------------
PHASE 0 — Session setup and memory recall
----------------------------------------------------------------
0.1  Run `mem-search` (claude-mem) with the project name and the words "refactor", "bug", "duplicate", "perf". Surface anything we learned in past sessions before reading the repo cold.
0.2  Check for and read in this order if present: `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/`, `.planning/`, any `ADR-*` files, `CHANGELOG.md`.
0.3  If `CLAUDE.md` is missing, defer creating it until after Phase 1 (you will know enough by then). Note this in the TaskList.
0.4  Create a TaskList covering Phases 1–7 below, with the verification step under each phase as its own task. The user will be watching this list — keep it accurate.

----------------------------------------------------------------
PHASE 1 — LEARN the codebase (READ-ONLY, do not edit anything)
----------------------------------------------------------------
This is the most important phase. Allocate real time to it. Output is a single document `LEARN.md`.

1.1  Run the `learn-codebase` skill (claude-mem) to prime structured understanding.
1.2  In parallel (use `dispatching-parallel-agents` from Superpowers), spawn FOUR independent `Explore` agents with breadth "very thorough", each with a different lens:
       Agent A — Architecture: entry points, top-level modules, layering, where state lives, how requests flow, where I/O boundaries are (db, http, fs, queues, caches, third-party).
       Agent B — Conventions: naming style, file organisation, test layout, error-handling style, logging style, dependency-injection style, async style (callbacks vs promises vs async/await), config loading, secret handling.
       Agent C — Tests: what is tested, how (unit/integration/e2e), test framework, fixtures, mocks, coverage gaps, slow tests, flaky tests (look for `.skip`, `.only`, `xit`, `it.todo`).
       Agent D — Dependencies: production deps, dev deps, versions, what each is actually used for, anything outdated or known-vulnerable, any "we wrote our own X because of Y" notes.
1.3  Run `smart-explore` (claude-mem) for AST-level structure on the largest modules — it finds near-duplicate functions that grep cannot see.
1.4  Run the project's existing test suite once with the user's `<<TEST_COMMAND>>` to confirm the baseline is green BEFORE you change anything. If it is not green, list every failing test in `LEARN.md` under "Pre-existing failures" and do NOT attribute them to your refactor later.
1.5  Capture a perf baseline:
       - If there is a benchmark suite, run it and record numbers.
       - If not, write a short timing probe for any user-supplied `<<PERF_HOTSPOTS>>` and record numbers. Save the probe under `.refactor/baseline/`.
       - Record cold-start time, key request latencies, build time, bundle size (if applicable).
1.6  Use `mcp__ide__getDiagnostics` and capture the current lint/type-error counts. This is your baseline. The refactor must not increase any of these counts.
1.7  Produce `LEARN.md` with these sections — be specific, cite file paths and line numbers, no vague summaries:
       - Purpose of the codebase (1 paragraph)
       - Top-level architecture diagram (ASCII or Mermaid)
       - Module-by-module summary (1–3 sentences each, include LOC)
       - Hot paths (which code runs the most / matters the most)
       - I/O boundaries (every place the code talks to the outside world)
       - State model (what's mutable, where it lives, who owns it)
       - Conventions in use (with examples)
       - Test inventory (counts, frameworks, baseline pass/fail)
       - Dependency inventory (with version + purpose + risk note)
       - Perf baseline numbers (with how they were measured)
       - Diagnostic baseline (lint count, type-error count)
       - Anything surprising / "why is this here?" findings
       - Open questions for the user (numbered list)
1.8  STOP. Present `LEARN.md` to the user. Ask them to confirm understanding and answer the open questions before continuing. Do not proceed to Phase 2 without explicit go-ahead.

----------------------------------------------------------------
PHASE 2 — Catalogue problems (still READ-ONLY)
----------------------------------------------------------------
Output: `REFACTOR-MAP.md`. Four sections, each with a prioritized list.

2.1  BUG CANDIDATES — for each, capture: file:line, observed/expected, severity (P0/P1/P2), confidence (proven/likely/suspect), reproduction sketch. Sources:
       - `mcp__ide__getDiagnostics` errors and warnings
       - TODO/FIXME/HACK/XXX/BUG markers (grep them all)
       - try/catch that swallows errors silently
       - `any` types, `// @ts-ignore`, `// eslint-disable`
       - off-by-one and boundary checks on loops and slices
       - missing await on async functions
       - shared mutable state across async boundaries
       - unclosed resources (db connections, file handles, listeners, intervals)
       - error paths that never run in tests
2.2  DUPLICATE CLUSTERS — group near-identical functions/blocks. For each cluster: list every occurrence (file:line), pick a canonical version, explain why it wins, list the deltas the other copies have drifted into. Use `smart-explore` AST output as the primary signal; cross-check with grep on function names and unique string literals.
2.3  PERF ISSUES — for each: where, the smell (N+1, blocking IO, missing index, unbatched call, useless re-render, etc.), a way to measure, expected magnitude of win. Skip "feels slow" — only list things you can measure.
2.4  ARCHITECTURE / MAINTAINABILITY SMELLS — god modules, cyclic imports, leaky abstractions, magic numbers/strings, missing types at public boundaries, side effects buried in pure-looking functions, business logic in UI / UI logic in business layer, configuration scattered. Use `improve-codebase-architecture` (context-mode) and `pathfinder` (claude-mem) to surface these.
2.5  Rank everything by (impact × confidence) / risk. Mark the top 10 items as "in scope for this pass" and put the rest under "Backlog" so they are not lost.
2.6  STOP. Present `REFACTOR-MAP.md` to the user and confirm scope.

----------------------------------------------------------------
PHASE 3 — Plan the refactor in detail
----------------------------------------------------------------
3.1  Use the `Plan` agent (or `make-plan` claude-mem, or `gsd-plan-phase`) to produce `REFACTOR-PLAN.md` covering only the in-scope items from Phase 2.
3.2  The plan is a sequence of small, independently shippable steps. Each step has:
       - ID (S1, S2, …)
       - Title
       - Files touched (exact paths)
       - What changes and why (one paragraph)
       - For dedup steps: which version wins, what tests pin behavior on each site before collapse
       - Verification: exact test names to add/update, lint/type baselines that must not regress, perf numbers to recapture (if perf step)
       - Rollback note (one sentence — how to undo if it goes wrong)
       - Risk: low / medium / high
       - Estimated diff size in lines
3.3  Order steps to minimise risk: tests first, then dedup, then bug fixes, then perf, then larger structural changes last. Never sequence a high-risk change immediately before a release.
3.4  Identify which steps are independent and can be parallelised vs which have a hard ordering.
3.5  Stress-test the plan with `grill-me` and/or `grill-with-docs` (context-mode). Apply the feedback before showing it to the user.
3.6  STOP. Present `REFACTOR-PLAN.md`. Get explicit user approval. Do not begin editing without it.

----------------------------------------------------------------
PHASE 4 — Execute, step by step, with discipline
----------------------------------------------------------------
4.1  Use `gsd-execute-phase` OR `executing-plans` (Superpowers) OR `do` (claude-mem) as the executor.
4.2  For independent steps, fan out with `dispatching-parallel-agents` (Superpowers) or `subagent-driven-development`. Never parallelise dependent steps.
4.3  For each step, follow the inner loop strictly:
       a. Restate the step's verification criteria out loud (in the response) before starting.
       b. RED — write or update the failing test first (`test-driven-development` skill, or context-mode `tdd`). Run it, confirm it fails for the expected reason.
       c. GREEN — make the smallest change that turns the test green.
       d. For dedup: ensure tests on BOTH original sites are green pinning behavior, then collapse, then DELETE the dead copy in the SAME commit. The tree must never carry both.
       e. REFACTOR — clean up only what this step covers. Do not yak-shave into unrelated files.
       f. Run the full test suite. It must stay green.
       g. Run `mcp__ide__getDiagnostics`. Counts must not increase vs Phase 1 baseline.
       h. For perf steps, re-run the baseline probe. Record before → after numbers.
       i. Commit (atomic, one logical change). Use `gsd-executor` for atomic commit hygiene. Commit message format: `refactor(S<id>): <title>` with a body listing files and verification result.
       j. Mark the TaskList step complete only after a–i are all done.
4.4  If a step turns out to be wrong (e.g. you discover the two duplicates are not actually equivalent), STOP the step, document the finding in `REFACTOR-PLAN.md` under "Plan revisions", and re-plan. Do not force a bad merge.
4.5  Anti-yak-shave rule: if you find new problems during execution, capture them in `BACKLOG.md`, do not expand the current step's scope.

----------------------------------------------------------------
PHASE 5 — Review (BLOCKING quality gates)
----------------------------------------------------------------
All five gates must pass before Phase 6. Treat any failure as "go back to Phase 4 and fix."

5.1  `Skill: simplify` — review the cumulative diff for missed dedup, dead code, over-engineering, premature abstractions. Apply suggestions or justify rejecting them in the report.
5.2  `Skill: review` (claude-ai-skills) — structured PR-style review of the diff.
5.3  `Skill: security-review` — security pass on every changed file. Pay attention to: input validation, authn/authz checks moved or removed, secrets, SQL/template injection surfaces, deserialization, CSRF/CORS, path traversal.
5.4  `gsd-code-review` followed by `gsd-code-fixer` agent for auto-fixable findings.
5.5  Full test suite green. Re-run the perf baseline probe and confirm wins are real. Confirm `mcp__ide__getDiagnostics` counts have not regressed.

----------------------------------------------------------------
PHASE 6 — Verify against goals (goal-backward check)
----------------------------------------------------------------
6.1  Use `verification-before-completion` (Superpowers) and `gsd-verifier` agent. For each of the five goals at the top of this prompt, produce evidence:
       - Goal 1 (Learn): `LEARN.md` exists and the user confirmed it.
       - Goal 2 (Bugs): each bug from Phase 2 either fixed-with-regression-test or moved to backlog with reason.
       - Goal 3 (Dedup): each in-scope cluster collapsed; dead copies deleted; new tests cover the canonical version.
       - Goal 4 (Perf): before/after numbers for every perf change. Aggregate win quantified.
       - Goal 5 (Renewable): list of extracted modules, narrowed interfaces, removed magic values, added types, documented APIs. Diff-stats: LOC added vs LOC removed.
6.2  Any goal lacking evidence sends you back to Phase 4 for that item.

----------------------------------------------------------------
PHASE 7 — Final report and handoff
----------------------------------------------------------------
7.1  Produce `REFACTOR-REPORT.md`:
       - Executive summary (5 bullet points max)
       - BUGS FIXED — table: id | file:line | root cause | fix | regression test
       - DUPLICATES REMOVED — table: cluster | sites before | canonical | LOC deleted
       - PERF WINS — table: flow | metric | before | after | how measured
       - MAINTAINABILITY — narrative paragraph + diff-stats
       - BEHAVIOR CHANGES — any intentional change to public behavior, with reason
       - BACKLOG — everything intentionally deferred, with why
       - RISKS / WATCH-OUT — what to monitor in production after deploy
7.2  If `CLAUDE.md` was missing or stale, update it now using `Skill: init` so the next session starts smarter.
7.3  Save a fresh memory entry via claude-mem so future sessions inherit what we learned.
7.4  Use `gsd-ship` or `finishing-a-development-branch` to prepare the PR (do NOT push without user approval).

================================================================
TOOL CHEAT SHEET — reach for these by name
================================================================
Learning & memory: `mem-search`, `learn-codebase`, `knowledge-agent`, `Skill: init`
Mapping & structural search: `gsd-map-codebase`, `smart-explore`, `Explore` agent (breadth: very thorough), `pathfinder`
Debugging: `systematic-debugging` (Superpowers), `gsd-debug`, `gsd-debugger` agent, context-mode `diagnose`
Diagnostics: `mcp__ide__getDiagnostics`, `mcp__ide__executeCode`
Library docs (USE THIS, do not guess versions): Context7 MCP — `resolve-library-id` then `query-docs`
Fresh web research (only if Context7 misses): Exa MCP
Planning: `Plan` agent, `make-plan` (claude-mem), `gsd-plan-phase`, `writing-plans` (Superpowers)
Plan stress-test: `grill-me`, `grill-with-docs` (context-mode)
Execution: `gsd-execute-phase`, `executing-plans` (Superpowers), `do` (claude-mem), `gsd-executor` agent
TDD: `test-driven-development` (Superpowers), context-mode `tdd`
Parallel work: `dispatching-parallel-agents`, `subagent-driven-development` (Superpowers)
Quality gates: `Skill: simplify`, `Skill: review`, `Skill: security-review`, `gsd-code-review`, `gsd-code-fixer` agent, `gsd-secure-phase`, `gsd-validate-phase`
Architecture: `improve-codebase-architecture` (context-mode), `pathfinder` (claude-mem)
Verification: `verification-before-completion`, `gsd-verify-work`, `gsd-verifier` agent
Shipping: `gsd-ship`, `finishing-a-development-branch`
Worktrees for risky steps: `using-git-worktrees` (Superpowers), `EnterWorktree` tool

================================================================
ANTI-PATTERNS — refuse to do these
================================================================
- Editing before reading.
- "Refactoring" by renaming files or moving code without changing structure.
- Extracting a helper used in only one place.
- Adding abstractions for hypothetical future needs (YAGNI).
- Touching tests to make them pass instead of fixing the code.
- Marking a task done because the code "looks right" — only tests/benchmarks/diagnostics count.
- Merging duplicate paths without first proving semantic equality with tests on both sites.
- Letting a single commit carry both the new canonical version AND the old duplicates.
- Sweeping unrelated changes into a refactor commit.
- Claiming a perf win without numbers.
- Trusting training knowledge for a library API instead of Context7.
- Assuming "the tests will catch it" when the tests do not cover this path — write the test first.

================================================================
START NOW
================================================================
Begin with PHASE 0. After Phase 1 produces `LEARN.md`, STOP and show me the document and the open questions before continuing. Do not start Phase 2 without my go-ahead.
```

---

## How to use it

1. Open Claude Code (or a new Cowork session) in the repo you want to refactor.
2. Replace the four bracketed placeholders at the top of the prompt block (`<<TARGET_PATH>>`, `<<LANGUAGE_STACK>>`, `<<RUN_COMMAND>>`, `<<TEST_COMMAND>>`, and optionally `<<PERF_HOTSPOTS>>`).
3. Paste the whole block (everything inside the triple backticks) as your first message.
4. Expect the agent to pause twice before any code changes — once after `LEARN.md`, once after `REFACTOR-PLAN.md`. Review each and approve before letting it execute.

## Why this version is more careful

The earlier version started with mapping. This one inserts a dedicated **Phase 1 — Learn** that produces `LEARN.md` with architecture, conventions, tests, dependencies, a perf baseline, and a diagnostic baseline — captured in parallel by four `Explore` agents working under different lenses. Nothing gets edited until that document exists and you have signed off on it.

Every later phase ties its checks back to the baseline captured in Phase 1: tests must stay at or above the baseline pass count, `mcp__ide__getDiagnostics` counts cannot regress, and perf claims must be measured against the recorded numbers. The dedup rule is hardened so the tree is never left holding both copies, and every executed step now has its own inner red-green-refactor loop with explicit commit hygiene.
