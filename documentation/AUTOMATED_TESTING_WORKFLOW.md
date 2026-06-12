# Automated Testing Workflow

## Goal

Manual Excel/Selenium IDE checks are replaced by code-based tests that run from the repository and in CI.

The Excel workbook `E:/Donlot/test_case_v4 (1).xlsx` was parsed into:

- `tests/automated/test-case-manifest.json`

Baseline from the workbook:

- Functional TC: 64
- Non-functional TC: 16
- Total TC: 80

The automated traceability suite creates one source-contract subtest per TC, so the automated count stays aligned with the Excel baseline.

## Commands

Run TC traceability and source-code contract tests:

```bash
npm run test:tc
```

Run backend tests:

```bash
npm run test:be
```

Run frontend lint and build:

```bash
npm run test:fe
```

Run the full local CI-equivalent suite:

```bash
npm run test:ci
```

## CI Trigger

GitHub Actions workflow:

- `.github/workflows/automated-testing.yml`

Triggers:

- `push` to `main`
- `push` to `SCRUM-*`
- `push` to `codex/**`
- all `pull_request` events

CI stages:

1. Install root Node dependencies.
2. Run TC traceability tests.
3. Install PHP dependencies.
4. Run Laravel PHPUnit tests with SQLite in-memory.
5. Install frontend dependencies.
6. Run Next.js lint and build.

## JIRA Synchronization

The JIRA project `SCRUM` was checked through Composio MCP.

Observed project status:

- Total visible SCRUM issues: 56
- Done: 50
- To Do: 6

Every JIRA ticket referenced by the Excel test cases exists in the SCRUM project.

Known traceability gaps from the workbook:

- `FR-12` notification test cases have no JIRA ticket in the Excel workbook and the repo still documents FR-12 as not started.
- `NFR-03`, `NFR-04`, and `NFR-05` test cases also have no JIRA ticket in the workbook.

These gaps are intentionally represented in the manifest and source-contract tests. They should be closed by adding implementation tickets and updating the manifest when the product scope changes.

## Proposal Synchronization

Proposal requirements are represented by `FR-*` and `NFR-*` IDs in the manifest. The source-contract tests verify each requirement against one of:

- backend routes/controllers/models/tests,
- frontend pages/components/proxy routes,
- documentation-backed gaps when the proposal requirement is not implemented yet.

This keeps the automation honest: implemented requirements must have source-code evidence, while unimplemented proposal requirements stay visible instead of being marked as manually passed in Excel.
