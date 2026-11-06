/**
 * One-shot: enforce upload limits on the comment-media bucket itself.
 * Signed upload URLs can't carry a size/type limit, so without this anyone
 * holding one could upload any file of any size. The server also re-checks
 * each upload (verifyUploadedObject), but this stops it at upload time.
 *
 * Run (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
 *   pnpm dlx tsx scripts/harden-storage-bucket.ts
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { COMMENT_MEDIA_BUCKET, MAX_VIDEO_BYTES, supabaseAdmin } =
    await import('../src/lib/supabase-storage');
  const { ALL_ALLOWED_MIME } =
    await import('../src/helper/utils/attachment-kinds');
  if (!supabaseAdmin) throw new Error('Supabase env is missing');

  const { error } = await supabaseAdmin.storage.updateBucket(
    COMMENT_MEDIA_BUCKET,
    {
      // attachment URLs are rendered directly, so the bucket stays public
      public: true,
      fileSizeLimit: MAX_VIDEO_BYTES,
      // images, videos and documents (see attachment-kinds.ts)
      allowedMimeTypes: [...ALL_ALLOWED_MIME],
    },
  );
  if (error) throw error;

  const { data } = await supabaseAdmin.storage.getBucket(COMMENT_MEDIA_BUCKET);
  console.log('bucket now:', {
    public: data?.public,
    file_size_limit: data?.file_size_limit,
    allowed_mime_types: data?.allowed_mime_types,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
