# New Feature Backlog — TimeCraft

ฟีเจอร์ที่ "น่าทำต่อ" และตอบโจทย์ผู้ใช้จริง (ไม่ใช่ SaaS feature bingo)
จัดอันดับตาม **impact ต่อ user / effort**

---

## Tier 1 — High impact, ทำได้เร็ว (1-3 วัน) — 07/05/2026

### 1. Global Search (Cmd+K) — 07/05/2026
ค้น task / comment / project ใน popup เดียว
- ใช้ Postgres full-text search (`tsvector` + GIN index บน `tasks.title|description`, `task_comments.body`)
- shadcn `Command` มีอยู่แล้ว
- **ผู้ใช้ได้อะไร**: หา task ที่จำชื่อไม่แม่นได้, jump ไปจุดที่ต้องการเร็ว
- **Why now**: คนใช้ Kanban พอเกิน 50 task ก็เริ่มหาไม่เจอ

### 2. My Tasks / Filtered Views — 07/05/2026
หน้า/แท็บที่กรองอัตโนมัติ:
- "Assigned to me" (ทุก project)
- "Due this week", "Overdue"
- "Mentioned me" (อ่านจาก `task_comments.mentions`)
- **Why**: ตอนนี้ user ต้องเปิดทีละ project → เห็นภาพรวมตัวเองไม่ได้

### 3. Recurring Tasks — 07/05/2026
ทำ template task → ออกซ้ำตาม cron (`cron_jobs` + `job_queue` มีอยู่แล้ว!)
- เพิ่ม `tasks.recurrence_rule` (RRULE string) + `parent_template_id`
- worker สร้าง task ใหม่อัตโนมัติ
- **Why**: workflow ที่ทำซ้ำทุกสัปดาห์/เดือนคือ pattern หลักของ PM

### 4. Bulk Actions บน Board — 07/05/2026
- Shift+click หลาย task → เปลี่ยน status / assignee / tag / ลบ พร้อมกัน
- API `PATCH /api/task/[ids]` รับ comma-separated ids อยู่แล้ว
- **Why**: ตอนนี้ต้องคลิกทีละใบ — ช้ามากเวลา cleanup

---

## Tier 2 — High impact, ใช้เวลา (3-7 วัน)

### 5. Calendar View — 07/05/2026
context มี `'bar-calendar'` แล้ว แต่ยังว่าง
- render task ตาม `dueDate` ลง month/week grid
- drag เพื่อเลื่อน due date
- **Why**: ผู้ใช้ที่ทำงานสาย client/deliverable ดู board อย่างเดียวไม่พอ

### 6. Time Tracking — 07/05/2026
ตามชื่อ product! (TimeCraft) แต่ยังไม่มี
- `task_time_entries` (taskId, userId, startAt, endAt, durationSec, note)
- ปุ่ม start/stop timer ใน task detail
- รายงานต่อ project / ต่อ user / ต่อ tag
- **Why**: เป็น differentiator จริงๆ ที่ Trello/Notion ไม่มี (ต้องไปต่อ Toggl)

### 7. Activity Log / Audit Trail — 07/05/2026
log ทุก mutation: `who changed what, when`
- `activity_logs` (projectId, taskId?, actorId, action, before, after, createdAt)
- panel ใน task detail แสดง timeline
- **Why**: team งง ใครย้าย task / ใครเปลี่ยน status — ตอนนี้ไม่มี trail

### 8. Email Digest + Reply-to-Comment — 07/05/2026
- daily/weekly digest ส่งที่ค้างของ user
- mention notification ส่งอีเมลพร้อม `Reply-To: comment-{id}@inbound.timecraft...`
- ตอบกลับ email = สร้าง comment (Postmark/Mailgun inbound)
- **Why**: คนไม่เปิด app ทุกวัน ต้องมี surface นอก

---

## Tier 3 — Differentiator แต่ ROI สูง

### 9. Task Templates — 07/05/2026
- save task เป็น template (รวม subtasks, tags, default assignee)
- สร้าง task ใหม่จาก template ใน 1 คลิก
- เก็บ template ระดับ project + ระดับ org
- **Why**: ลดเวลา setup task ซ้ำๆ (เช่น "QA checklist" 10 ขั้น)

### 10. Task Automation Rules — 07/05/2026
"When X → do Y" แบบเบสิก:
- `When task moved to "Done" → set completedAt + notify reporter`
- `When due date passes → move to "Overdue" column`
- เก็บใน `automation_rules` (projectId, trigger, conditions, actions)
- ใช้ `job_queue` ที่มีอยู่ run async
- **Why**: PM ขั้นกลางจะรอ feature นี้เพื่อหยุดทำงานเดิมๆ

### 11. Public Share View (read-only) — 07/05/2026
- แชร์ project/task ให้ stakeholder ภายนอกดู (ไม่ต้อง login)
- token-based URL หมดอายุได้
- redact field ที่ sensitive
- **Why**: ตอน present ลูกค้า/ผู้บริหาร ไม่ต้องเอา screenshot

### 12. Dashboard / Project Analytics — 07/05/2026
chart พื้นฐาน:
- velocity (task ที่ปิดต่อสัปดาห์)
- burn-down (เหลือกี่ task)
- distribution per assignee / per priority
- ใช้ `recharts` (lightweight)
- **Why**: hook ให้ owner/admin มาเข้า app บ่อยขึ้น

---

## Tier 4 — Nice-to-have

### 13. Task Linking / Cross-references — 07/05/2026
- mention `#task-id` ใน comment → render เป็น chip คลิกได้
- "Blocked by" / "Related to" (มี `task_dependencies` อยู่แล้ว — ใช้ต่อยอด)

### 14. Saved Filters / Smart Lists — 07/05/2026
- save query "tag:bug + assignee:me + status:in-progress" เป็น filter ส่วนตัว
- แชร์ filter กับ team ได้

### 15. Keyboard Shortcuts Overlay (`?`) — 07/05/2026
- doc shortcuts ทั้งหมดในที่เดียว
- เพิ่ม shortcut: `c` = new task, `/` = search, `e` = edit selected

### 16. Import / Export — 07/05/2026
- export project เป็น CSV / JSON
- import จาก Trello / Asana (cover 80% ของ migration cases)
- **Why**: ลด friction ตอนคน switch มา TimeCraft

### 17. AI Helpers (optional) — 07/05/2026
- auto-summary ของ comment thread ยาวๆ
- suggest due date จาก task title ("ส่งวันศุกร์" → set Friday)
- ใช้ Anthropic API (ต้นทุนเริ่มต้นต่ำมากกับ Haiku)

---

## ที่**ไม่ควรทำ**ก่อน (ดักไว้)

- ❌ **Custom fields** — เพิ่ม config surface เยอะมาก ROI ต่ำในระยะแรก
- ❌ **Multiple boards per project** — overlap กับ filtered views
- ❌ **Gantt chart** — niche, dataset ส่วนใหญ่ไม่เหมาะกับ Gantt
- ❌ **In-app chat / DM** — ไม่ใช่ core PM, แข่งกับ Slack ไม่ได้
- ❌ **Native mobile app** — PWA + responsive web ก่อน, native ทีหลัง

---

## ลำดับแนะนำสำหรับ next 1-2 sprint

1. **Global Search** (Tier 1) — quick win, user ขออันดับ 1 ใน Kanban tool ทุกตัว
2. **My Tasks view** (Tier 1) — ต่อยอดจาก search filter
3. **Time Tracking** (Tier 2) — เป็น core differentiator ตามชื่อ product
4. **Activity Log** (Tier 2) — ทำ trust + ลด support ticket "ใครทำ X"
