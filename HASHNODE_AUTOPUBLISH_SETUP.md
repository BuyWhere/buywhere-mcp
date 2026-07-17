# Hashnode Autopublish Setup

This repository includes an hourly GitHub Action at `.github/workflows/sync-devto-to-hashnode.yml`.

The action converts new published Dev.to posts into root-level markdown files that Hashnode's official "Publish from GitHub" integration can publish automatically.

## What the workflow does

1. Reads published Dev.to posts for `buywhere`.
2. Keeps only posts published on or after `2026-05-29T00:00:00Z`.
3. Generates `hashnode-post-<devto-id>-<slug>.md` files in the repository root.
4. Adds Hashnode frontmatter, including:
   - `domain: buywhere.hashnode.dev`
   - `canonical: <original dev.to URL>`
   - tag slugs and SEO metadata
5. Commits any new files so Hashnode can pick them up.

## One-time manual setup still required

Hashnode must be connected to this repository with the official GitHub integration.

Follow Hashnode's current docs:

- `Publish from GitHub`
- `Publish for GitHub Frontmatter Breakdown`

Once the Hashnode app is installed on the repo, new generated markdown files should publish automatically from future hourly runs.

## Notes

- Hashnode's docs say the GitHub publisher only reads markdown files in the repository root.
- Hashnode's docs also say only 10 file changes are respected in a single commit, so the generator caps new post creation at 10 per run.
- The cutoff is intentionally pinned to `2026-05-29T00:00:00Z` so this pipeline covers future Dev.to posts rather than backfilling the full archive.
