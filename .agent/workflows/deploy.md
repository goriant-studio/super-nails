---
description: Create PR, merge to master, and deploy to production (GitHub Pages + Cloudflare Worker)
---

// turbo-all

# Deploy to Production

This workflow creates a feature branch, commits changes, creates a PR, merges it, and production deploys automatically via GitHub Actions.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- All checks passing (`./AGENTS.sh typecheck && ./AGENTS.sh build`)

## Steps

### 1. Verify checks pass before creating PR

// turbo

```bash
cd /Users/lamle/Development/SuperNails && ./AGENTS.sh typecheck && ./AGENTS.sh build
```

### 2. Create a new feature branch

Choose a descriptive branch name like `feat/feature-name` or `fix/bug-name`.

```bash
cd /Users/lamle/Development/SuperNails && git checkout -b <branch-name>
```

### 3. Stage and commit all changes

```bash
cd /Users/lamle/Development/SuperNails && git add -A && git commit -m "<descriptive commit message>"
```

### 4. Push the branch to origin

```bash
cd /Users/lamle/Development/SuperNails && git push -u origin <branch-name>
```

### 5. Create a Pull Request

```bash
cd /Users/lamle/Development/SuperNails && gh pr create --title "<PR title>" --body "<PR description>" --base master
```

### 6. Merge the PR

```bash
cd /Users/lamle/Development/SuperNails && gh pr merge --squash --delete-branch
```

### 7. Switch back to master and pull

// turbo

```bash
cd /Users/lamle/Development/SuperNails && git checkout master && git pull origin master
```

### 8. Verify deployment

After merging to `master`, GitHub Actions automatically:

- Builds the client (`npm --prefix client run build`)
- Deploys to **GitHub Pages** (static frontend)
- Deploys **Cloudflare Worker** (reverse proxy at `super-nails.goriant.com`)

Check deployment status:

```bash
cd /Users/lamle/Development/SuperNails && gh run list --limit 3
```

You can also watch the running deploy:

```bash
cd /Users/lamle/Development/SuperNails && gh run watch
```

### 9. Verify production site

Open the production URL to verify:

- GitHub Pages: `https://goriant-studio.github.io/super-nails/`
- Custom domain: `https://super-nails.goriant.com/`

### 10. Run e2e tests against production

Run the API e2e tests against the live Cloudflare Worker:

```bash
cd /Users/lamle/Development/SuperNails && WORKER_URL=https://super-nails.goriant.com npx playwright test e2e/api.spec.ts
```

## Notes

- **Database migration**: The SQLite DB is server-side only (local Express). For GitHub Pages (static), the app falls back to `client/public/api/bootstrap.json`. If you need to update the static fallback data, run the server locally (`./AGENTS.sh dev`), then copy the API output to `client/public/api/bootstrap.json`.
- **Cloudflare Worker** deploys from `server-cloudflare-function/` directory automatically on merge.
- **Rollback**: Use `gh run rerun <run-id>` or revert the PR with `gh pr create --title "Revert: ..." --body "..."`.
