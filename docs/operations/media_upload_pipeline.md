# Media Upload Pipeline

This runbook explains how photos move from a contributor's browser into durable storage for the SC9 Photo Book 2025 project. The flow keeps GitHub Pages static while delegating uploads to a serverless API backed by Amazon S3.

## Architecture Overview

1. **Browser (upload.html)**
   - Contributors select a month, optionally add notes, and pick up to 20 images per batch.
   - `assets/js/upload.js` POSTs file metadata to the upload API and then streams each file to S3 using the returned pre-signed URL.

2. **Upload API (serverless)**
   - An AWS Lambda function fronted by API Gateway (`POST /uploads/presign`) receives the request.
   - The function validates the requester (JWT, GitHub OAuth, or signed key), normalises metadata, and issues a pre-signed S3 POST/PUT URL.
   - The API returns `{ uploadUrl, fields?, fileUrl }` so the browser can upload directly to S3 and capture the public URL or key.

3. **Storage**
   - Amazon S3 bucket `sc9-photobook-2025-media` with folders per month (`january/`, `february/`, …) to keep galleries in sync.
   - Versioning is enabled so accidental overwrites can be rolled back.
   - A lifecycle rule transitions originals to Glacier after 12 months while keeping optimised derivatives in the public tier.

4. **Metadata sync (optional but recommended)**
   - An AWS Lambda triggered by S3 `ObjectCreated` events can push file metadata (key, caption notes, photographer, EXIF) into DynamoDB or Airtable for editorial workflows.

The diagram below summarises the components:

```
Browser ──▶ API Gateway ──▶ Lambda (create upload URL) ──▶ S3 bucket
             ▲                                        │
             └─────── Optional auth provider ─────────┘
```

## Provisioning Checklist

| Component | Action |
| --- | --- |
| **S3 bucket** | Create `sc9-photobook-2025-media` in `us-east-1`. Enable versioning and default encryption (SSE-S3). Create month folders. |
| **IAM role** | `LambdaPhotobookUploaderRole` with `s3:PutObject`, `s3:PutObjectAcl`, and `s3:GetObject` scoped to the bucket. |
| **Lambda** | Deploy `serverless/create-upload-url.js` (Node 18 runtime). Configure environment variables noted below. |
| **API Gateway** | HTTP API with a `POST /uploads/presign` route pointing to the Lambda. Enable CORS for `https://sc9photobook2025.com`. |
| **Secrets** | Store `AUTH_SHARED_SECRET` (if using HMAC tokens) and `ALLOWED_ORIGINS` in AWS Secrets Manager. Reference them via Lambda environment variables. |
| **Monitoring** | Enable CloudWatch logs, create alarms for 5XX responses, and set up S3 object-level CloudTrail for auditing. |

## Lambda Environment Variables

| Variable | Purpose |
| --- | --- |
| `BUCKET_NAME` | Target S3 bucket. |
| `PUBLIC_BASE_URL` | Optional CDN base (e.g., `https://media.sc9photobook2025.com`). Used to craft `fileUrl`. |
| `ALLOWED_MONTHS` | Comma-separated list (`january,february,...`) to validate folder names. |
| `MAX_FILE_BYTES` | Maximum accepted file size (e.g., `26214400` for 25 MB). |
| `ALLOWED_ORIGINS` | Origins permitted in CORS responses. |
| `AUTH_SHARED_SECRET` | Secret used to validate `Authorization: Bearer <token>` HMACs or other lightweight auth. |

## Security Controls

- **Authentication**: Require a signed JWT or shared secret token embedded in `Authorization` headers from the upload form. Rotate keys every quarter.
  - Prefer short-lived tokens fetched from a trusted session service; avoid shipping permanent secrets in the static markup.
- **CORS**: Restrict to production and staging domains. Deny requests from unrecognised origins.
- **Input validation**: Sanitize filenames, enforce lower-case month slugs, and reject unsupported MIME types.
- **Permissions**: S3 bucket policy should *only* allow uploads via the pre-signed URLs. No public `PutObject` rights.
- **Malware scanning**: Optionally integrate an S3 virus scan Lambda (e.g., ClamAV) and quarantine suspicious files.

## Front-End Configuration

1. Update `upload.html`'s `data-upload-endpoint` attribute with the deployed API URL (e.g., `https://api.sc9photobook2025.com/uploads/presign`).
2. If authentication tokens are required, embed them via a short-lived signed cookie, populate `data-upload-token` on the form, or render a `<meta name="sc9-upload-token">` tag with the temporary credential.
3. Adjust copy limits in `assets/js/upload.js` if the backend allows more than 20 files or larger payloads.

## Post-Upload Workflow

1. Editors review new objects via the S3 console or an Airtable dashboard fed by the metadata sync Lambda.
2. Optimise images (resize/compress) using an automation pipeline (e.g., AWS Lambda triggered on new uploads or a GitHub Action pulling from S3).
3. Copy the optimised assets into `/assets/img/<month>/` for the static site and update the relevant `months/*.html` entries.
4. Regenerate the monthly pages (if using automation) and merge into `main` for GitHub Pages deployment.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Failed to create upload link (403)` | Missing/invalid auth token or month not in `ALLOWED_MONTHS`. | Re-authenticate, confirm dropdown month values match backend config. |
| Upload stalls at 0% | Pre-signed URL expired (default 15 minutes). | Refresh `upload.html` to request a new link. |
| Files missing in gallery | Editors have not pulled assets from S3 into the repo yet. | Sync objects, run optimisation, update the monthly HTML. |
| CORS error in console | API Gateway `Access-Control-Allow-Origin` misconfigured. | Update the Lambda response headers or API Gateway settings. |

## Related Files

- [`upload.html`](../../upload.html)
- [`assets/js/upload.js`](../../assets/js/upload.js)
- [`serverless/create-upload-url.js`](../../serverless/create-upload-url.js)

Keep this document updated whenever storage locations, auth schemes, or automation steps change.
