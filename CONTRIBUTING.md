# Contributing to BrandHub

BrandHub is a creative asset management and collaboration platform for agency Admins, Designers, and Clients. It uses phase ownership, contract-first APIs, and pull-request integration. Read `docs/plans/BrandHub_Final_Phase_Plan.md`, `docs/api/API_CONTRACT.md`, and the relevant phase gate before editing code.

## Ownership

| Developer | Owned phases |
|---|---|
| Dev A | Phase 0: audit, decisions, contract; Phase 1: foundation; Phase 2: authentication, users, roles |
| Dev B | Phase 3: projects, requests, public projects; Phase 4: asset management |
| Dev C | Phase 5: collaboration and review; Phase 6: dashboards, seed data, polish; Phase 7: release |

One developer owns each phase. Other developers review that work. Cross-phase edits need an issue or an approved, documented minor edit. Bugs return to the phase owner. Every owner writes and runs the tests for their phase, and dependent pull requests wait for their prerequisites.

## Branches and integration

- `main`: stable releases only. No direct pushes or force pushes.
- `develop`: shared integration. No direct pushes or force pushes.
- `feature/p<phase>-<area>-<name>`: phase features.
- `fix/p<phase>-<issue>`: fixes owned by a phase.
- `chore/p<phase>-<name>`: documentation, tooling, and configuration.

Open pull requests against `develop`; the final release pull request runs from `develop` to `main`. Rebase or merge the current `develop` before requesting review. Prefer squash merges and focused pull requests.

PR workflow: branch from the latest `develop`, implement only the owned phase scope, update tests and documentation, run the relevant checks, push the branch, open a PR using the repository template, address the required review, and squash-merge only after dependencies and required checks pass. The author must not approve their own work in place of the required reviewer.

Recommended branch protection for `main` and `develop`: require pull requests, block force pushes and deletion, require at least one approval and passing checks, and dismiss stale approvals. Phase 0 requires Dev A sign-off plus approvals from Dev B and Dev C. The final release requires two approvals. These settings are recommendations until a repository administrator confirms them in GitHub.

## Review rotation

- Dev A pull request: Dev B reviews.
- Dev B pull request: Dev C reviews.
- Dev C pull request: Dev A reviews.
- Phase 0 contracts: Dev A signs off; Dev B and Dev C approve.
- Final release pull request: Dev A and Dev B approve.

## Commit and pull request rules

Use `feat:`, `fix:`, `chore:`, `docs:`, `test:`, or `refactor:`. Explain the behavior and reason, link the phase and FR IDs, and include positive and negative verification. Follow the shared API contract; propose contract changes in the same or an earlier pull request and identify every affected owner.

Do not commit `.env`, credentials, database exports, generated dependency folders, or confidential assets. Browser variables beginning with `VITE_` are public and must never contain secrets.

Each PR updates the API contract, ADRs, setup guide, or README when behavior changes. Tests must cover the positive path plus relevant validation, permission, persistence, concurrency, and failure paths. UI work also follows the phase plan's breakpoint, theme, keyboard, and reduced-motion checks.

## Database isolation

Each developer uses a separate development database, for example `brandhub_devA`, `brandhub_devB`, and `brandhub_devC`. Put the selected URI only in that developer's uncommitted environment. Never seed, reset, migrate destructively, or run cleanup against another developer's database, a shared database, or production. Tests use an isolated test database and clean up only records they create.

## Conflicts and cross-phase changes

When work overlaps, stop editing the conflicting shared file and notify both phase owners in the issue or PR. Agree on the contract change and the developer who will implement it; the other owner rebases after that change merges. Resolve conflicts by preserving both approved behaviors and rerun affected checks. Never settle a conflict by discarding unfamiliar changes. Escalate unresolved product or architecture conflicts to all three developers and record the decision in `docs/decisions.md`.

## Definition of done

A task is done when its code is merged into `develop`, required permissions and validation cases pass, loading/empty/error/success states are handled, persistence is verified where applicable, responsive and keyboard checks pass for UI work, and limitations are documented. A file's presence alone is not evidence that a feature works.
