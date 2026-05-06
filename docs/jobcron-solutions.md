# JobCron Solutions

เอกสารนี้รวบรวมวิธีทำ background worker / job processing สำหรับ feature ที่ enqueue job เข้า `job_queue` แต่ยังไม่ได้ทำ worker จริง — เพื่อให้ทีมหยิบไป implement ได้เมื่อถึงเวลา ตอนนี้ฝั่งที่ produce job ทำงานปกติ แค่ "consumer/worker" ยังว่าง

---

## 1. Comment notification → Email worker

### Context

Feature 1 (Task Comments & Mentions) จะ enqueue job เข้า `job_queue` ทุกครั้งที่ comment ใหม่มี `@mentions`:

```ts
// src/app/api/task/[id]/comments/route.ts (POST)
await tx.insert(jobQueueTable).values(
  mentions.map((mentionedUserId) => ({
    jobType: "send_notification",
    payload: {
      kind: "comment_mention",
      mentionedUserId,
      taskId,
      commentId,
      actorUserId: sessionUserId,
      projectId,
      snippet: body.slice(0, 200),
    },
    idempotencyKey: `comment_mention:${commentId}:${mentionedUserId}`,
    priority: 5,
    maxAttempts: 3,
    scheduledAt: new Date(),
  })),
);
```

In-app notification (ตาราง `notifications`) ถูก insert ตรง ๆ ใน transaction เดียวกับ comment — **ไม่ผ่าน job queue** เพราะต้องการ realtime ทันที. ส่วน **email** ผ่าน job queue เพื่อไม่ block request handler

### What's missing

ยังไม่มี:
1. Email provider integration (Resend / SendGrid / SES / Postmark)
2. Email template renderer
3. Worker process ที่ดึง job จาก queue มา process

### Recommended approach

#### Provider: Resend
เหตุผล: API ง่าย, free tier 3000/month, integration ดีกับ Next.js, รองรับ React Email templates

```bash
pnpm add resend @react-email/components
```

ENV ที่ต้องเพิ่ม:
```
RESEND_API_KEY=
EMAIL_FROM="TimeCraft <noreply@yourdomain.com>"
APP_URL=https://timecraft.app  # สำหรับ deep link ใน email
```

#### Worker design — เลือก 1 ใน 3

##### Option A: Vercel Cron + API route (เลือกถ้า deploy บน Vercel)

เพิ่มใน `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-jobs",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

Route `/api/cron/process-jobs/route.ts`:
```ts
import { authenticateCron } from "@/lib/cron-auth"; // ตรวจ CRON_SECRET header
import { db } from "@/db";
import { jobQueueTable } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { sendCommentMentionEmail } from "@/lib/email/send-comment-mention";

export async function GET(req: Request) {
  if (!authenticateCron(req)) return new Response("Unauthorized", { status: 401 });

  // pull พร้อม lock ผ่าน FOR UPDATE SKIP LOCKED — กัน double-process ถ้า cron ซ้อน
  const jobs = await db.transaction(async (tx) => {
    const ready = await tx.execute(sql`
      SELECT id FROM job_queue
      WHERE status = 'pending'
        AND scheduled_at <= now()
        AND attempts < max_attempts
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 25
      FOR UPDATE SKIP LOCKED
    `);
    if (ready.rows.length === 0) return [];

    const ids = ready.rows.map((r: any) => r.id);
    return tx
      .update(jobQueueTable)
      .set({ status: "processing", startedAt: new Date(), attempts: sql`attempts + 1` })
      .where(and(eq(jobQueueTable.status, "pending"), sql`id = ANY(${ids})`))
      .returning();
  });

  for (const job of jobs) {
    try {
      switch (job.jobType) {
        case "send_notification":
          await sendCommentMentionEmail(job.payload as any);
          break;
        // case "send_email": ...
      }
      await db.update(jobQueueTable)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(jobQueueTable.id, job.id));
    } catch (err) {
      const isFinalAttempt = job.attempts >= job.maxAttempts;
      await db.update(jobQueueTable)
        .set({
          status: isFinalAttempt ? "failed" : "pending",
          lastError: (err as Error).message,
          // exponential backoff: ลองใหม่ใน 1m, 5m, 25m
          scheduledAt: isFinalAttempt
            ? job.scheduledAt
            : new Date(Date.now() + Math.pow(5, job.attempts) * 60_000),
        })
        .where(eq(jobQueueTable.id, job.id));
    }
  }

  return Response.json({ processed: jobs.length });
}
```

ข้อดี: ไม่ต้อง infrastructure แยก, deploy พร้อม Next.js
ข้อเสีย: max 1 ครั้งต่อนาที (Vercel Hobby), throughput จำกัดที่ ~25 jobs/min/cron run

##### Option B: BullMQ + Redis (เลือกถ้า volume สูง / self-host)

```bash
pnpm add bullmq ioredis
```

แยก worker process รัน standalone:
```ts
// scripts/worker.ts
import { Worker } from "bullmq";
import { sendCommentMentionEmail } from "@/lib/email/send-comment-mention";

new Worker("notifications", async (job) => {
  if (job.data.kind === "comment_mention") {
    await sendCommentMentionEmail(job.data);
  }
}, { connection: redisConnection, concurrency: 10 });
```

API route producer ก็ enqueue ผ่าน BullMQ แทน insert `job_queue` table:
```ts
import { Queue } from "bullmq";
const queue = new Queue("notifications", { connection: redisConnection });
await queue.add("comment_mention", payload, {
  jobId: `comment_mention:${commentId}:${mentionedUserId}`, // idempotency
  attempts: 3,
  backoff: { type: "exponential", delay: 60_000 },
});
```

⚠️ ถ้าเลือก option นี้ — **ตาราง `job_queue` ใน schema ปัจจุบันจะกลายเป็นซ้ำซ้อน** เลือกอย่างใดอย่างหนึ่ง:
- ใช้ `job_queue` table เป็น source of truth + Redis เป็นแค่ scheduler/runtime → เพิ่ม sync layer
- เก็บแค่ Redis → ลบ `job_queue` ออก (ตาม CLAUDE.md "อย่าให้ overlapping abstractions")

ข้อดี: throughput สูง, retry/backoff/priority พร้อม, observability ดีผ่าน Bull Board
ข้อเสีย: ต้อง host Redis (Upstash free tier OK), worker เป็น process แยก

##### Option C: pg-boss (เลือกถ้าอยาก stay on Postgres)

```bash
pnpm add pg-boss
```

ใช้ Postgres เดิมเป็น queue — pg-boss จัดการ locking/retry/backoff ให้ผ่าน LISTEN/NOTIFY + advisory locks

```ts
import PgBoss from "pg-boss";
const boss = new PgBoss(process.env.DATABASE_URL!);
await boss.start();
await boss.work("comment_mention", async (job) => {
  await sendCommentMentionEmail(job.data);
});
```

⚠️ pg-boss สร้าง schema ตัวเองชื่อ `pgboss` — ต้องตัดสินใจว่าจะเลิกใช้ `job_queue` table เดิมหรือไม่

ข้อดี: ไม่ต้อง infra เพิ่ม (ใช้ Supabase Postgres เดิม), feature ครบ
ข้อเสีย: lock contention ถ้า volume สูงมาก (>1000 jobs/sec)

### Email template (React Email)

```tsx
// src/lib/email/templates/comment-mention.tsx
import { Body, Button, Container, Head, Html, Link, Preview, Text } from "@react-email/components";

export const CommentMentionEmail = ({
  actorName, taskTitle, projectName, snippet, deepLink,
}: { ... }) => (
  <Html>
    <Head />
    <Preview>{actorName} mentioned you in {taskTitle}</Preview>
    <Body>
      <Container>
        <Text><strong>{actorName}</strong> mentioned you on <em>{projectName}</em></Text>
        <Text style={{ borderLeft: "3px solid #ddd", paddingLeft: 12 }}>
          {snippet}
        </Text>
        <Button href={deepLink}>View task</Button>
      </Container>
    </Body>
  </Html>
);
```

### Send helper

```ts
// src/lib/email/send-comment-mention.ts
import { Resend } from "resend";
import { render } from "@react-email/components";
import { CommentMentionEmail } from "./templates/comment-mention";
import { db } from "@/db";
import { usersTable, projectsTable, tasksTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendCommentMentionEmail(payload: {
  mentionedUserId: string; taskId: string; commentId: string;
  actorUserId: string; projectId: string; snippet: string;
}) {
  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, payload.mentionedUserId));
  const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, payload.actorUserId));
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, payload.taskId));
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, payload.projectId));

  if (!recipient || !actor || !task || !project) return; // soft skip ถ้าข้อมูลหาย

  const html = await render(CommentMentionEmail({
    actorName: actor.fullName,
    taskTitle: task.title,
    projectName: project.name,
    snippet: payload.snippet,
    deepLink: `${process.env.APP_URL}/project?taskId=${task.id}`,
  }));

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: recipient.email,
    subject: `${actor.fullName} mentioned you in "${task.title}"`,
    html,
  });
}
```

---

## 2. Cleanup workers (อ้างอิงจาก enums ที่มี `cleanup_columns`, `expire_success`)

### `cleanup_columns` — purge soft-deleted columns

Schema `columnsTable` มี `isDeleted`, `deletedAt`, `purgeAt` — สมมติ flow คือ delete = soft, แล้ว `purgeAt` = `deletedAt + 30d`. Worker job รัน daily:

```ts
// ใน process-jobs handler
case "cleanup_columns":
  await db.delete(columnsTable).where(
    and(eq(columnsTable.isDeleted, true), lte(columnsTable.purgeAt, new Date()))
  );
  break;
```

cron registration:
```ts
// scripts/seed-cron.ts (รันครั้งเดียว)
await db.insert(cronJobsTable).values({
  name: "daily_cleanup_columns",
  cronExpression: "0 3 * * *",
  jobType: "cleanup_columns",
  enabled: true,
});
```

### `expire_success` — auto-archive jobs สำเร็จเก่า

```ts
case "expire_success":
  await db.delete(jobQueueTable).where(
    and(
      eq(jobQueueTable.status, "completed"),
      lte(jobQueueTable.completedAt, sql`now() - interval '30 days'`)
    )
  );
  break;
```

---

## 3. Cron registry → enqueue scheduled jobs

ตาราง `cron_jobs` มีอยู่แต่ไม่มี mechanism ที่อ่าน `cronExpression` แล้ว enqueue เข้า `job_queue` ตามเวลา. ต้องเพิ่ม:

```ts
// src/app/api/cron/dispatch/route.ts — รันทุก 1 นาทีจาก Vercel Cron
import cronParser from "cron-parser";

export async function GET(req: Request) {
  if (!authenticateCron(req)) return new Response("Unauthorized", { status: 401 });

  const jobs = await db.select().from(cronJobsTable).where(eq(cronJobsTable.enabled, true));
  const now = new Date();

  for (const job of jobs) {
    if (!job.nextRunAt || job.nextRunAt > now) continue;

    // enqueue + คำนวณ nextRunAt ถัดไป
    const interval = cronParser.parseExpression(job.cronExpression);
    await db.transaction(async (tx) => {
      await tx.insert(jobQueueTable).values({
        cronJobId: job.id,
        jobType: job.jobType,
        scheduledAt: now,
        idempotencyKey: `cron:${job.id}:${now.toISOString()}`,
      });
      await tx.update(cronJobsTable)
        .set({
          lastRunAt: now,
          nextRunAt: interval.next().toDate(),
          lastStatus: "enqueued",
        })
        .where(eq(cronJobsTable.id, job.id));
    });
  }
  return Response.json({ dispatched: jobs.length });
}
```

```bash
pnpm add cron-parser
```

---

## 4. Observability (recommended ก่อน production)

| Tool | Why |
|---|---|
| Sentry | Capture worker errors แทน console.error |
| Job dashboard route `/admin/jobs` | List `job_queue` filter by status — debug failed jobs ได้ไว |
| Alert: failed > N | ส่ง Slack/email ถ้า `status = 'failed'` มากกว่า threshold |

---

## 5. Recommended order ของการ implement worker (เมื่อพร้อม)

1. **Resend account** + ENV setup (15 min)
2. **Email template** + send helper (30 min)
3. เลือก worker option (A/B/C) — แนะนำ **Option A (Vercel Cron)** สำหรับเริ่มต้น เพราะไม่ต้อง infra เพิ่ม
4. `/api/cron/process-jobs` route + auth (1 hr)
5. `/api/cron/dispatch` route สำหรับ cron registry (1 hr)
6. Test end-to-end: comment → mention → check email ส่งจริง
7. ถ้า volume ขึ้น → migrate ไป Option B (BullMQ + Redis)

---

## ที่ feature comment ทำไว้แล้ว (ไม่ต้องทำซ้ำ)

✅ In-app notification (ตาราง `notifications`) — insert ตรง ๆ ใน transaction comment, broadcast ผ่าน Pusher channel `user-{userId}`  
✅ Job enqueue สำหรับ email — insert เข้า `job_queue` พร้อม `idempotencyKey` และ payload ครบ  
✅ Idempotency key pattern: `comment_mention:{commentId}:{userId}` — รันซ้ำไม่ส่งอีเมลซ้ำ  

❌ Worker process — ตามเอกสารนี้  
❌ Email provider integration — ตามเอกสารนี้  
❌ Cron dispatcher — ตามเอกสารนี้
