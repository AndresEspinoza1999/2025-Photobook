# Media Upload Pipeline (Firebase Migration)

The legacy uploader has been decommissioned. This document tracks the plan for rebuilding the workflow on Firebase
Storage and Cloud Functions so contributors can once again submit photos directly from the browser.

> **Firebase scaffolding in repo**
> - `firebase.json` and `firestore.rules` now live at the repository root for easy `firebase init` handoff.
> - `functions/index.js` includes placeholder `generateUploadUrl` and `confirmUpload` exports (both throw `unimplemented`).
> - `functions/package.json` declares the Firebase Admin SDK dependencies and Node 18 runtime so deployment scripts know what to install.

## Target Architecture

1. **Browser (upload.html)**
   - Contributors pick a month, add optional photographer + story notes, and select up to 20 media files.
   - `assets/js/upload.js` will call a Firebase HTTPS function to request an upload ticket, then hand the file to Firebase
     Storage when the new backend ships.

2. **Firebase HTTPS Function (Create Upload Ticket)**
   - Validates the request (Auth session, signed token, or invite-only codes).
   - Generates a signed upload URL or uses the Firebase Admin SDK to mint resumable upload sessions.
   - Returns the target bucket path, temporary credentials, and any metadata the front end needs to display progress.

3. **Firebase Storage Bucket**
   - Holds raw uploads in per-month folders (`january/`, `february/`, etc.).
   - Enforces server-side encryption, lifecycle policies, and uniform bucket-level access.
   - Emits events that downstream automation (Cloud Functions or scheduled GitHub Actions) can process to optimise images and
     sync curated copies into `/assets/img/<month>/` inside this repository.

4. **Metadata Sync (Optional)**
   - A Cloud Function listening to Storage events can push metadata into Firestore/Airtable for editorial tracking or notify the
     #sc9-photos channel when new assets arrive.

## Migration Checklist

| Task | Status |
| --- | --- |
| Create Firebase project + Storage bucket dedicated to SC9 Photo Book. | ☐ |
| Define security rules that restrict uploads to authenticated contributors. | ☐ |
| Implement HTTPS function that validates month slugs, file sizes, and MIME types. | ☐ |
| Update `assets/js/upload.js` to talk to the Firebase function once available. | ☐ |
| Document how to rotate API tokens / Firebase service accounts. | ☐ |
| Automate image optimisation + repo sync via Cloud Functions or GitHub Actions. | ☐ |

## Temporary Workflow

Until the Firebase uploader is available:

1. Contributors drop media into the shared drive and mention the target month + caption notes in the upload request issue or
   Slack thread.
2. Editors copy files into `/assets/img/<month>/`, optimise as needed, and update the monthly HTML pages.
3. Track outstanding uploads and migration progress in this document or the shared roadmap.

## Next Steps

- Finalise the Firebase project structure (environments, service accounts, secrets).
- Build a lightweight admin dashboard (could live in `upload.html`) that surfaces queued submissions once the backend is live.
- Replace this placeholder once the Firebase endpoints, tokens, and automation scripts are deployed.
