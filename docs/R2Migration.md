# R2 Migration Plan

> **Scope:** Migrate solutions and test cases from `website/public/past_contests/` to Cloudflare R2 as the canonical data store. This document defines the contract for the migration and the source-of-truth rule that follows it.

---

## Table of Contents

- [Goals](#goals)
- [Non-Goals](#non-goals)
- [Source-of-Truth Rule](#source-of-truth-rule)
- [Current State](#current-state)
- [Target R2 Layout](#target-r2-layout)
- [Renaming Strategy](#renaming-strategy)
- [Cloudflare R2 Reference](#cloudflare-r2-reference)
- [Cron and Sync Design](#cron-and-sync-design)
- [Migration Steps](#migration-steps)
- [Open Questions](#open-questions)

---

## Goals

1. Produce a clean, organized copy of every solution and test case in R2.
2. Treat the upload as a one-shot copy. The website continues to serve from `public/past_contests/` until the API phase replaces it.
3. Establish path conventions, content-type handling, and language tagging before upload, so re-uploads are not required.
4. Enable removal of `website/public/past_contests/` (~3.7 GB) from the repository in a later phase.

## Non-Goals

- No API, Worker endpoints, or service layer in this phase. Data movement only.
- No user submission or write paths.
- No re-normalization of test cases. The website's normalized set is accepted as-is, including its known discrepancies vs. the raw archive.
- No Git LFS. The migration's purpose is to remove these files from version control, not to manage them within it.
- No changes to file names or layout under `website/public/`. Renaming occurs only on the local staging copy used for upload.

## Source-of-Truth Rule

After data lands in R2:

> R2 is the source of truth. The website repository contains no canonical data; it is a renderer only. The `CCCTestData` GitHub repository is a frozen raw archive — never read by the application and never written back into.
>
> - All writes target R2.
> - All sync flows are R2 → external, never the reverse.
> - Drift is impossible by construction because there is exactly one writer.

The current data inconsistency exists because three independent writers (the website's static files, the `CCCTestData` repository, and ad-hoc manual edits) coexist with no canonical store. Establishing a single writer is the central purpose of this migration.

## Current State

- `website/public/past_contests/` — approximately 3.7 GB. Normalized but lossy. For example, 2024 S5 contains 113 cases here vs. 115 in the raw archive. Treated as the canonical user-facing set.
- `CCCTestData` GitHub repository — over 4 GB. Holds older years previously removed from the website (1996–2003 and a portion of 2016+ prior to a partial backfill). Filenames and folder layouts vary across years, with duplicates and gaps. Naming is not consistently normalized.
- Years currently present under `website/public/past_contests/`: 1996 through 2026.
- Solution files: approximately 298 `solution*.txt` across all years. Many problems have none.
- Existing discovery logic in the contest page issues blind `fetch()` calls and parses for `<!doctype html>` to detect 404 fallbacks. Test case discovery performs up to 20 sequential blind fetches per problem load. Both behaviors are replaced by manifest-driven access in a later phase.

## Target R2 Layout

```
r2://<bucket>/contests/{year}/{code}/tests/{n}.in
r2://<bucket>/contests/{year}/{code}/tests/{n}.out
r2://<bucket>/contests/{year}/{code}/solutions/{1,2,3}.{cpp,py,java,txt}
r2://<bucket>/contests/{year}/{code}/manifest.json   (added in the API phase)
```

Conventions enforced by the layout:

- File names omit the problem code, since the path already contains it. `tests/1.in`, not `s5.1.in`.
- The legacy `test_data/` folder is replaced with `tests/`.
- Solutions are numbered consistently from 1, with no missing indices. The legacy mix of `solution.txt`, `solution2.txt`, and `solution3.txt` is collapsed into `1.txt`, `2.txt`, `3.txt`.
- Solutions are stored with their detected language extension. Language detection runs once during the migration; from that point forward, language is determined by file extension and the runtime regex detector (`app/contest/[contestYear]/[problemCode]/page.tsx:235`) is no longer required.
- No `raw/` prefix in R2. The raw archive remains exclusively on GitHub.

## Renaming Strategy

Renaming occurs only on the local staging copy used for upload. The website repository is not modified during this phase. The migration script:

1. Reads from `website/public/past_contests/` (read-only).
2. Writes a renamed, normalized tree to `tmp/r2-staging/contests/...`.
3. Uploads `tmp/r2-staging/` to R2.

The website continues to function unchanged throughout. Removal of `website/public/past_contests/` is deferred until the API phase, when the contest page reads from R2 instead.

Renaming during this upload is free. Renaming objects in R2 after upload requires a copy-and-delete per object, which incurs Class A charges across roughly 5,000 files. The path scheme is finalized before upload.

## Cloudflare R2 Reference

R2 exposes an S3-compatible data plane. Any S3 client (e.g., `aws-sdk-js`, `rclone`, `s3cmd`) works against `https://<account-id>.r2.cloudflarestorage.com` using R2 access keys.

Differences from S3 relevant to this migration:

- No bucket-level ACLs and no `x-amz-acl: public-read`. Public access is configured at the bucket level via the R2.dev subdomain or a custom domain. Public access is not required, since the future API proxies all reads.
- No object versioning. Overwrites are destructive; the migration is structured to avoid them.
- No S3-style lifecycle rules.
- Egress is free. Class A operations (writes, list) are billed; Class B (reads) are billed at a lower rate. Re-uploads should be avoided; path conventions are finalized in advance.
- `Content-Type` is not auto-detected on `PutObject` and defaults to `application/octet-stream`. This is acceptable because the API will set `Content-Type` when re-serving. Direct R2.dev URLs are not used for browser rendering.
- For bulk uploads, `rclone` is preferred over hand-written SDK code. It handles retries, multipart uploads, parallelism, and resumption. Custom SDK code is reserved for the API layer.

## Cron and Sync Design

The cron-driven mirror is the second phase, executed after the migration in this document is complete. It is documented here to lock the design before implementation.

- **Mechanism.** Cloudflare Workers Cron Triggers, configured in `wrangler.toml`:
  ```toml
  [triggers]
  crons = ["0 * * * *"]
  ```
  The Worker fires on schedule without an inbound HTTP request. The cron handler is `scheduled(event, env, ctx)`.
- **Direction.** R2 → GitHub only. Reading from GitHub would reintroduce the multi-writer drift this migration exists to eliminate.
- **Mirror target.** The `CCCTestData` repository, under a `normalized/` top-level folder. The existing raw archive remains untouched.
- **Append-only.** No deletes are propagated, even when objects are removed from R2. This guarantees the GitHub mirror is a non-destructive backup.
- **State tracking.** A JSON file in R2 (`_sync/github-head.json`) records which objects have already been mirrored. Each run diffs against this state and pushes only new content.
- **Idempotency.** Repeated runs with no R2 changes produce no commits.
- **Operational guarantee.** The "R2 is the sole writer" rule is enforced in code: the cron job never reads from GitHub, and no other process writes to R2 outside the API.

## Migration Steps

Steps are strictly ordered.

1. **Provision R2.** Create the bucket and generate API tokens with read/write scope. Store credentials in a local `.env` (gitignored). Add a redacted `.env.example` to the repository.
2. **Lock the bucket name.** Once chosen, the name is recorded in this document and in `.env.example`.
3. **Build the staging script.** A Node script that:
   - Walks `website/public/past_contests/` (read-only).
   - Skips files containing `<!doctype html>` or with zero bytes (404 artifacts from the static host).
   - Runs the language detector on each solution file and assigns an appropriate extension.
   - Writes the renamed tree to `tmp/r2-staging/contests/...` per the [Target R2 Layout](#target-r2-layout).
   - Emits a JSON report listing skipped files, language assignments, and any path collisions for manual review.
4. **Review the report.** Inspect skipped files and language assignments. Re-run the script as needed; it operates entirely on local storage.
5. **Upload via `rclone`.**
   ```sh
   rclone config   # configure an s3 remote with provider=Cloudflare and R2 credentials
   rclone copy ./tmp/r2-staging r2:<bucket> --progress --transfers 16 --checksum
   ```
6. **Verify.** Run `rclone check ./tmp/r2-staging r2:<bucket> --size-only`, followed by `--checksum` for a full integrity pass.
7. **Conclude this phase.** API development, contest page refactor, and cleanup of `website/public/past_contests/` are tracked separately.

## Open Questions

- Bucket name is not yet chosen.
- R2 API tokens are not yet generated.
- `tsconfig.tsbuildinfo` is currently untracked but not gitignored. To be addressed alongside this work.
- Solution authorship metadata is not currently captured in any structured form. Decision deferred to the API phase: either backfill an "anonymous" attribution for pre-migration files, or capture authorship only on submissions made after the API ships.
- Discrepancies between the website's normalized set and the raw archive (e.g., 2024 S5's case count) are not reconciled in this phase. If a specific problem requires correction later, the relevant files are re-normalized manually and overwritten in R2.