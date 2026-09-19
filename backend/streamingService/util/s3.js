const { S3Client } = require('@aws-sdk/client-s3');

const buildAwsCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  return undefined;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: buildAwsCredentials(),
});

const buildPublicUrl = (key) => {
  if (!key) {
    return null;
  }

  if (/^https?:\/\//i.test(key)) {
    return key;
  }

  // The ingress's rewrite rule for /api/streaming/* strips that literal
  // prefix and re-adds a bare /api/, so a browser-facing URL has to start
  // with /api/streaming/streaming/... for the rewritten path to land back
  // on this service's own /api/streaming/<route> mount (the same doubling
  // /streaming/videos relies on). streamUrl gets one "streaming" baked in
  // here and the other from the frontend's base URL; thumbnailUrl is used
  // as-is with no base prepended, so both must be baked in directly.
  // No hardcoded localhost fallback either — that host isn't reachable
  // from a real browser once this is deployed anywhere but a dev machine.
  const base = process.env.STREAMING_PUBLIC_URL?.replace(/\/$/, '');
  const path = `/api/streaming/streaming/thumbnails/${encodeURI(key)}`;
  return base ? `${base}${path}` : path;
};

const buildStreamUrl = (videoId) => {
  const base = process.env.STREAMING_PUBLIC_URL?.replace(/\/$/, '');
  // Relative to the frontend's STREAMING_API_URL base (itself "/api/streaming"),
  // mirroring the already-working /streaming/videos calls — the ingress rewrite
  // re-adds "/api" once, giving /api/streaming/stream/:id on the backend.
  // Do NOT prefix with /api/streaming here, or the base + this path double up.
  const path = `/streaming/stream/${videoId}`;
  if (!base) {
    return path;
  }
  return `${base}${path}`;
};

module.exports = {
  s3Client,
  buildPublicUrl,
  buildStreamUrl,
};
