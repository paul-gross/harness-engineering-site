# grosscode.net

The [Quartz](https://quartz.jzhao.xyz) site behind [grosscode.net](https://grosscode.net) — a digital garden about harness engineering.

The site has **no content of its own**. All content lives in [paul-gross/harness-engineering](https://github.com/paul-gross/harness-engineering), a pure-markdown repository that knows nothing about this site. At build time the content repo is checked out and transformed into Quartz's conventions by [`scripts/prepare-content.mjs`](./scripts/prepare-content.mjs):

1. `README.md` files become `index.md` folder pages (links rewritten to match)
2. Leading `# H1` headings are lifted into frontmatter `title:`
3. `created`/`modified` frontmatter is stamped from the content repo's git history

## Deployment

[`deploy.yml`](./.github/workflows/deploy.yml) builds and deploys to GitHub Pages (custom domain `grosscode.net`) on:

- every push to `master`
- a daily schedule (picks up new content pushed to harness-engineering)
- manual `workflow_dispatch`
- `repository_dispatch` of type `content-updated` (for push-triggered rebuilds from the content repo)

## Local build

```bash
npm ci
npx quartz plugin install
node scripts/prepare-content.mjs <path-to-harness-engineering> content
npx quartz build --serve
```

> [!warning]
> `content/` is generated and must never be committed — but it also must **not** be
> gitignored: Quartz's file globber respects `.gitignore`, so ignoring it produces an
> empty site (the CI build reads `content/` in a fresh checkout where it's rebuilt).

## Updating Quartz

This repo tracks upstream Quartz (`upstream` remote). To update:

```bash
git fetch upstream
git merge upstream/v5
```
