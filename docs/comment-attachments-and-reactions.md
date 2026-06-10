# Comment Attachments & Reactions

รองรับการแนบรูป/วิดีโอและกด emoji reaction บน comment ของ task

## สรุปฟีเจอร์

- แนบ **รูป** (`image/png`, `jpeg`, `webp`, `gif` — max 10MB)
- แนบ **วิดีโอ** (`video/mp4`, `webm`, `quicktime` — max 50MB)
- แนบได้สูงสุด **10 ไฟล์ต่อ comment**
- เพิ่มไฟล์ได้ 3 ทาง: ปุ่ม picker / paste จาก clipboard / drag-drop
- preview thumbnail พร้อม progress + ปุ่มลบ ก่อนกด send
- **Reactions**: 6 emoji (👍 ❤️ 😂 😮 😢 🎉) toggle ต่อ user
- realtime ผ่าน Pusher event ใหม่ `comment-reaction-changed`

## Architecture (สั้นๆ)

```
Client                     API server               Supabase Storage         DB
  │                            │                          │                   │
  │ 1. POST /comment/upload-url                            │                   │
  │  ─────────────────────────►│                          │                   │
  │                            │ create signed upload URL │                   │
  │                            │ ─────────────────────────►                   │
  │  ◄─{uploadUrl, path, publicUrl}                       │                   │
  │                            │                          │                   │
  │ 2. PUT uploadUrl (file bytes — bypass API server)     │                   │
  │  ─────────────────────────────────────────────────────►                   │
  │                            │                          │                   │
  │ 3. POST /task/:id/comments {body, attachments[{url, type, ...}]}          │
  │  ─────────────────────────►│                          │                   │
  │                            │ insert comment + attachments (transaction)   │
  │                            │ ───────────────────────────────────────────► │
  │                            │ trigger Pusher comment-added                 │
  │  ◄─created (with attachments + reactions)             │                   │
```

ไฟล์ใหญ่**ไม่ผ่าน API server** — client PUT ตรงเข้า Supabase Storage ด้วย signed URL อายุสั้นๆ

## Schema

### `task_comment_attachments`
| คอลัมน์ | type | หมายเหตุ |
| --- | --- | --- |
| id | uuid (PK) | |
| comment_id | uuid (FK → task_comments) | cascade delete |
| type | enum `image` \| `video` | |
| storage_path | text | `{projectId}/{taskId}/{uuid}-{filename}` |
| url | text | public URL |
| mime_type | text | |
| size_bytes | int | |
| width / height | int? | จาก client probe |
| duration_ms | int? | video เท่านั้น |
| order_index | int | ลำดับใน comment |
| created_at | timestamptz | |

Index: `(comment_id, order_index)`

### `task_comment_reactions`
| คอลัมน์ | type | หมายเหตุ |
| --- | --- | --- |
| comment_id | uuid (FK) | cascade |
| user_id | uuid (FK) | cascade |
| emoji | text | จำกัดที่ 6 ตัวใน server-side |
| created_at | timestamptz | |

PK: `(comment_id, user_id, emoji)` — กันกดซ้ำ
Index: `(comment_id)`

Migration: `drizzle/0006_first_wild_pack.sql`

## API Routes

| Method | Path | Permission | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/comment/upload-url` | `comment:upload` | คืน signed upload URL + public URL |
| `POST` | `/api/task/[taskId]/comments` | `task:comment` (+ `comment:upload` ถ้ามี attachments) | รับ `attachments[]` |
| `POST` | `/api/comment/[id]/reaction` | `comment:react` | toggle emoji |

ทุก route ใช้ `createHandle` / `createParamHandle` จาก [src/lib/api/handle.ts](../src/lib/api/handle.ts) + Zod validation + `authorizeOrThrow`

## RBAC ([src/lib/rbac/permissions.ts](../src/lib/rbac/permissions.ts))

| Role | `comment:upload` | `comment:react` |
| --- | --- | --- |
| owner | ✓ | ✓ |
| admin | ✓ | ✓ |
| editor | ✓ | ✓ |
| viewer | ✗ | ✓ |

viewer สามารถ react ได้ แต่อัปโหลดไม่ได้

## Realtime Events (Pusher channel `task-{taskId}`)

| Event | Payload |
| --- | --- |
| `comment-added` (เดิม) | `{ comment, clientId }` — comment มี `attachments[]` แล้ว |
| `comment-updated` (เดิม) | `comment` |
| `comment-deleted` (เดิม) | `{ id }` |
| **`comment-reaction-changed`** (ใหม่) | `{ commentId, reactions: ReactionSummary[] }` |

Subscribe ใน [src/store/sync-live-data/useTaskComments.tsx](../src/store/sync-live-data/useTaskComments.tsx)

## Storage Layout (Supabase Storage)

Bucket: `task-comment-media` (public)

```
task-comment-media/
  {projectId}/
    {taskId}/
      {uuid}-{sanitized-filename}
```

API ตรวจ `storagePath` ฝั่ง server ว่าขึ้นต้นด้วย `{projectId}/{taskId}/` เพื่อกัน user ใส่ path มั่ว

## ไฟล์ที่เพิ่ม / แก้ (สำคัญ)

**ใหม่:**
- [src/db/schema/task-comment-attachment.table.ts](../src/db/schema/task-comment-attachment.table.ts)
- [src/db/schema/task-comment-reaction.table.ts](../src/db/schema/task-comment-reaction.table.ts)
- [src/lib/supabase-storage.ts](../src/lib/supabase-storage.ts) — Supabase admin client + mime/size limits
- [src/helper/utils/comment-upload.ts](../src/helper/utils/comment-upload.ts) — client upload flow + media probing
- [src/app/api/comment/upload-url/route.ts](../src/app/api/comment/upload-url/route.ts)
- [src/app/api/comment/[id]/reaction/route.ts](../src/app/api/comment/[id]/reaction/route.ts)

**แก้:**
- [src/db/schema/index.ts](../src/db/schema/index.ts), [relations.ts](../src/db/schema/relations.ts)
- [src/db/uniq-query/comment/comment-utils.ts](../src/db/uniq-query/comment/comment-utils.ts) — `fetchAttachmentsForComments`, `fetchReactionsForComments`
- [src/app/api/task/[anyIds]/comments/route.ts](../src/app/api/task/[anyIds]/comments/route.ts) — รับ `attachments[]` + validate
- [src/lib/rbac/permissions.ts](../src/lib/rbac/permissions.ts)
- [src/types/comment.d.ts](../src/types/comment.d.ts)
- [src/services/comment.service.ts](../src/services/comment.service.ts) — `createUploadUrl`, `toggleReaction`
- [src/store/use-comment.store.ts](../src/store/use-comment.store.ts) — `toggleReaction`, `ingestReactionChanged`
- [src/store/sync-live-data/useTaskComments.tsx](../src/store/sync-live-data/useTaskComments.tsx)
- [src/components/task-detail/comment-composer.tsx](../src/components/task-detail/comment-composer.tsx)
- [src/components/task-detail/comment-item.tsx](../src/components/task-detail/comment-item.tsx)
- [src/components/task-detail/comment-list.tsx](../src/components/task-detail/comment-list.tsx)

## Setup ที่ต้องทำก่อนใช้งาน

### 1. Env vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
```

หาได้ที่ Supabase Dashboard → Project Settings → **API**
(ใช้ project เดียวกับ `DATABASE_URL`)

⚠️ `SUPABASE_SERVICE_ROLE_KEY` มีสิทธิ์ bypass RLS — server-side เท่านั้น ห้าม leak

### 2. สร้าง Storage bucket

Supabase Dashboard → **Storage** → **New bucket**
- ชื่อ: `task-comment-media`
- **Public bucket: ON** (เพื่อให้ `getPublicUrl` ใช้งานได้)

### 3. Restart dev server

```bash
pnpm dev
```

## Known Limitations / Future Work

- **Orphan files**: ลบ comment แล้ว row ใน DB cascade หาย แต่ไฟล์ใน Storage ยังอยู่ — ต้องเพิ่ม cron cleanup
- **No virus scan**: ไฟล์อัปโหลดแล้วใช้งานทันที ถ้าต้องการ scan ให้ผ่าน edge function หรือ queue
- **Public bucket**: URL เปิด public ใครได้ link ก็ดูได้ ถ้าต้องการ access control ต้องเปลี่ยนเป็น private bucket + ออก signed read URL ตอน fetch comments
- **Reactions**: คงที่ 6 emoji — ถ้าจะเพิ่ม custom emoji ต้อง expand allow-list ใน [reaction route](../src/app/api/comment/[id]/reaction/route.ts)
- **Edit attachments**: ตอนนี้ edit comment ได้แค่ body — ลบ/เพิ่ม attachment หลัง send ยังไม่รองรับ
