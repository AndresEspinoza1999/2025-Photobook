/* eslint-disable no-console */
'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

const {
  AWS_REGION = 'us-east-1',
  BUCKET_NAME,
  PUBLIC_BASE_URL,
  ALLOWED_MONTHS = 'january,february,march,april,may,june,july,august,september,october,november,december',
  MAX_FILE_BYTES = '26214400',
  ALLOWED_ORIGINS = 'https://sc9photobook2025.com,https://sc9photobook2025.github.io,http://localhost:4000',
  AUTH_SHARED_SECRET,
} = process.env;

const s3 = new S3Client({ region: AWS_REGION });
const allowedMonths = new Set(
  ALLOWED_MONTHS.split(',')
    .map((month) => month.trim().toLowerCase())
    .filter(Boolean)
);
const allowedOrigins = ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
const maxFileBytes = Number.parseInt(MAX_FILE_BYTES, 10) || 26214400;

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  Vary: 'Origin',
};

let currentOrigin = allowedOrigins[0] || '*';

const buildHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  ...baseCorsHeaders,
});

const respond = (statusCode, body = {}, extraHeaders = {}) => {
  return {
    statusCode,
    headers: { ...buildHeaders(currentOrigin || allowedOrigins[0] || '*'), ...extraHeaders },
    body: JSON.stringify(body),
  };
};

const normalizeFilename = (filename = '') => {
  return filename
    .normalize('NFKD')
    .replace(/[\s]+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'upload';
};

const verifyAuth = (event) => {
  if (!AUTH_SHARED_SECRET) {
    return true; // Auth disabled.
  }
  const header = event.headers?.authorization || event.headers?.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return false;
  }
  const token = header.slice('Bearer '.length).trim();
  return token === AUTH_SHARED_SECRET;
};

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*'))) {
    currentOrigin = requestOrigin;
  } else {
    currentOrigin = allowedOrigins[0] || '*';
  }

  if (event.httpMethod === 'OPTIONS') {
    return respond(200, { ok: true });
  }

  if (!BUCKET_NAME) {
    return respond(500, { error: 'Missing BUCKET_NAME environment variable.' });
  }

  if (!verifyAuth(event)) {
    return respond(401, { error: 'Unauthorized' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return respond(400, { error: 'Invalid JSON payload.' });
  }

  const month = String(payload.month || '').toLowerCase();
  if (!allowedMonths.has(month)) {
    return respond(400, { error: 'Month is required and must match an allowed value.' });
  }

  const filename = normalizeFilename(payload.filename);
  const contentType = payload.contentType || 'application/octet-stream';
  const objectKey = `${month}/${Date.now()}-${filename}`;

  const metadata = {
    notes: payload.notes ? String(payload.notes).slice(0, 500) : '',
    photographer: payload.photographer ? String(payload.photographer).slice(0, 120) : '',
    month,
  };

  try {
    const presignedPost = await createPresignedPost(s3, {
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Fields: {
        'Content-Type': contentType,
      },
      Conditions: [
        ['content-length-range', 0, maxFileBytes],
        ['starts-with', '$Content-Type', ''],
      ],
      Expires: 900, // 15 minutes
    });

    const fileUrl = PUBLIC_BASE_URL
      ? `${PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`
      : `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${objectKey}`;

    return respond(200, {
      uploadUrl: presignedPost.url,
      fields: presignedPost.fields,
      fileUrl,
      key: objectKey,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create presigned post', error);
    return respond(500, { error: 'Failed to create upload URL.' });
  }
};
