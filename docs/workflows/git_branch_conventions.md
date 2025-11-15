# Git Branch Conventions

## Publishing Branch
- `main` is the canonical branch for production.
- GitHub Pages deploys directly from `main` at the repository root, so every merge to `main` immediately updates https://sc9photobook2025.com/.

## Working Branches
- Create topic branches from `main` for any new work (e.g., `feature/new-gallery`, `fix/typo-homepage`).
- Keep pull requests small and focused; rebase or merge `main` frequently to avoid drift.

## Merging Strategy
- When a feature branch is approved, merge it into `main` via a pull request to trigger a Pages deployment.
- After merging, delete the merged branch in the remote to keep the branch list tidy.
- If long-lived branches exist (for example, `work`), fast-forward or merge them into `main` and archive them once the contents are live.

## Verification Checklist
1. Run `git status` to ensure the working tree is clean before merging.
2. Confirm GitHub Actions (if configured) pass on the pull request.
3. Verify https://sc9photobook2025.com/ serves the latest changes after the merge completes.

## Maintenance
- Quarterly, audit the repository for stale branches and either merge or delete them.
- Document any branching deviations (hotfixes, release branches) in this file so the team knows which branches deploy where.
