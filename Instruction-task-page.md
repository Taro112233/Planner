# Phase 2 Instruction: หน้า Task แบบ Full Page (Task Detail Page)

เอกสารนี้คือ spec สำหรับ phase ถัดไปของ Planner UI ต่อจาก Phase 1 (Board shell + Board/List/Calendar/Timeline
4 views ที่เสร็จแล้ว) ใช้เป็น source of truth สำหรับการสร้างหน้า Task รายละเอียดแบบเต็มหน้า (full page)
เพิ่มเติมจาก slide-over panel (`TaskDetailModal`) ที่มีอยู่แล้ว — **ไม่ใช่การแทนที่**

ขอบเขตปัจจุบันเป็น **route + UI composition layer** โดยใช้ service function ที่มีอยู่แล้วเป็นหลัก
อนุญาตให้เพิ่ม service function ใหม่เฉพาะที่ full page ต้องการแต่ slide-over ยังไม่มี (ระบุในข้อ 4)
ยังไม่อนุญาตให้แตะ schema, สร้างโมเดลใหม่ (Attachment, Comment), ทำระบบ multi-plan/Board,
หรือทำ custom permission matrix จนกว่าจะมีคำสั่งแยกต่างหาก

## 1. คำศัพท์และโครงสร้าง

```text
/board                          → BoardPage (Kanban/List/Calendar/Timeline) — Phase 1
/board/tasks/[taskId]           → TaskPage (ใหม่ — full page) — Phase 2
```

- `TaskPage` คือหน้าเต็มสำหรับดู/แก้ `TaskItem` หนึ่งใบ อยู่ภายใต้ `app/board/layout.tsx` เดิม
  (สืบทอด `PlannerShell` sidebar + topbar โดยอัตโนมัติ)
- ใช้ DTO เดิมทั้งหมดจาก `types/planner.ts` (`TaskDetailDto`, `SubtaskNodeDto`, `TaskActivityDto`,
  `OrganizationMemberDto`) — ห้ามสร้าง DTO ใหม่ซ้ำความหมายเดิม ขยาย field เพิ่มได้ถ้าจำเป็น
- `TaskDetailModal` (slide-over) ยังอยู่เหมือนเดิม ใช้เป็น quick-view เวลาคลิกการ์ดจากทุก view
  `TaskPage` คือปลายทางเมื่อผู้ใช้กด "เปิดเต็มหน้า" ในตัว panel หรือเข้า URL ตรง/แชร์ลิงก์

## 2. การ adapt เข้ากับของเดิมใน Phase 1

- Layout: reuse `app/board/layout.tsx` (`PlannerShell`) ห้ามสร้าง shell ใหม่ซ้ำ
- Component module ใหม่: `components/TaskPage/` ตามข้อบังคับ feature-folder ของ `CLAUDE.md`
  (`index.ts`, `TaskPage.tsx`, `TaskPageHeader.tsx`, `TaskPageSkeleton.tsx` เป็นต้น)
- Reuse ตรง ๆ ได้จาก `components/TaskDetail/`: `RecursiveSubtaskList`
- ส่วนที่ทั้ง `TaskDetailModal` และ `TaskPage` ต้องใช้ร่วมกัน (status chip row, assignee picker,
  add-subtask form) ให้ extract เป็น component เล็กใน `components/TaskDetail/` แล้ว import ใช้ทั้งสองฝั่ง
  ห้าม copy โค้ดซ้ำสองที่
- API เดิมที่ใช้ได้ทันทีไม่ต้องแก้: `GET /api/board/tasks/[taskId]`, `PATCH .../move`,
  `PATCH .../subtasks/[subtaskId]`, `POST` และ `DELETE .../assignees`, `POST .../subtasks`
- Groups สำหรับ status chip: `TaskPage` ไม่มี `board.groups` ใน context เหมือน `BoardPage`
  (คนละหน้า ไม่มี prop-drill ต่อกัน) ต้องมี endpoint เบาที่คืนแค่รายชื่อ column
  (`id`, `name`, `color`, `sortOrder` เท่านั้น ไม่ query `taskItems`) — เพิ่ม
  `GET /api/board/groups` + service function `listGroups(organizationId)` ใหม่

## 3. Route และ data flow

- `app/board/tasks/[taskId]/page.tsx` — client component, auth-gate แบบเดียวกับ `app/board/page.tsx`
  (redirect ไป `/login` ถ้าไม่มี session, แสดง skeleton ระหว่างเช็ค)
- ดึง/แก้ข้อมูลด้วย hook ใหม่ `hooks/useTaskDetail.ts` (fetch + mutate ตาม pattern เดียวกับ `useBoard.ts`)
  แทนการใช้ fetch helper ท้องถิ่นแบบใน `TaskDetailModal.tsx` เดิม เพราะตอนนี้มีผู้ใช้ร่วมสองจุด
  (`TaskDetailModal` ใช้ helper เดิมต่อไปได้ก่อน หรือ migrate มาใช้ hook เดียวกันก็ได้ — ไม่บังคับใน phase นี้)
- Breadcrumb: "← กลับไปที่บอร์ด" ลิงก์กลับ `/board` ด้วย `next/link`
- การเปิด `TaskPage` จาก Board/List/Calendar/Timeline: เพิ่มปุ่ม "เปิดเต็มหน้า" ในตัว panel เดิม
  (ลิงก์ไป `/board/tasks/[taskId]`) — คลิกการ์ดตรง ๆ ยังเปิด panel เหมือน Phase 1 ทุกประการ
  ไม่เปลี่ยนพฤติกรรมเดิม

## 4. Capability ใหม่ที่ full page ต้องมีเพิ่มจาก slide-over เดิม

Slide-over ปัจจุบัน (Phase 1) มีแล้ว: status chip (เปลี่ยน column), assignee picker, add subtask
(root เท่านั้น), badge (read-only แสดงผลอย่างเดียว), activity feed (10 รายการล่าสุด)

full page ต้องมีเพิ่มจากนี้:

| Capability | Service function ใหม่ (`board.service.ts`) | หมายเหตุ |
|---|---|---|
| แก้ชื่องาน (title) | `updateTaskTitle` | inline edit, save on blur/Enter, log `TASK_UPDATED` |
| แก้ description | `updateTaskDescription` | textarea + ปุ่ม save (ไม่ autosave ทุก keystroke) |
| แก้ priority | `updateTaskPriority` | dropdown เหมือน status chip |
| แก้ start/due date | `updateTaskDates` | ใช้ `components/ui/calendar.tsx` ที่มีอยู่แล้ว |
| เพิ่ม subtask ระดับลูก (depth 1-2) | ขยาย `addSubtask` ให้รับ `parentSubtaskId` เป็น optional | ต้องเช็ค depth ไม่เกิน 2 ตาม `prisma/Instruction-task.md` invariant I2 |
| ลบ subtask | `deleteSubtask` | cascade ลบลูกทั้งหมด แล้ว recompute counters ของแม่และ `TaskItem` |
| เปลี่ยนชื่อ subtask | `renameSubtask` | |
| ดู activity ทั้งหมด (ไม่ใช่แค่ 10 ล่าสุด) | `listTaskActivity` + pagination | ใช้ `useDataList` pattern เดิมของ repo |

ทุก mutation ใหม่ต้องบันทึก `TaskActivity` ด้วย `action` ที่ตรงกับ `ActivityAction` enum ที่มีอยู่แล้ว
(เช่น `TASK_UPDATED`, `SUBTASK_RENAMED`, `SUBTASK_DELETED`) ตาม pattern เดียวกับฟังก์ชันเดิมใน
`board.service.ts` (สร้าง TaskActivity ใน `$transaction` เดียวกับการแก้ข้อมูลเสมอ)

Controller layer (`app/api/board/tasks/[taskId]/**`) ต้องตาม pattern Layer 1/2/3 เดิมทุกไฟล์
(Arcjet → session → Zod → service → map error message เป็น HTTP status) ตามตัวอย่างที่มีอยู่แล้ว

## 5. Deferred (ยังไม่ทำใน phase นี้)

- Attachment / ไฟล์แนบ — mockup มีกล่อง placeholder แต่ยังไม่มี model ใน schema รอ phase แยก
- Comment — ไม่มีใน schema ปัจจุบัน
- Delete task / ถังขยะ (Trash) — รอ phase Trash ตามที่ตกลงไว้ก่อนหน้า
- Badge management (สร้าง/ผูก badge ใหม่ให้ task) — แสดงผลอย่างเดียวเหมือน Phase 1
- Custom permission matrix (Access Groups) — ยังใช้ `lib/shared/role-helpers.ts` เดิมตามที่ตกลงไว้
- Multi-plan/Board ต่อ organization — ยังคง 1 board ต่อ organization
- Nested subtask add ผ่านการ์ดบน Kanban โดยตรง (ยังทำผ่าน `TaskPage`/panel เท่านั้น)

## 6. คำสั่งตรวจงานระยะนี้

```bash
pnpm type-check
pnpm test
pnpm dev
```

`pnpm test` ใช้งานได้แล้ว — toolchain ของ vitest ที่ค้างมาตั้งแต่ Phase 1 ถูกซ่อมแล้ว
เป็นปัญหาสองชั้นซ้อนกัน ไม่เกี่ยวกับโค้ดของ Phase 1/2 เลย:

1. **native binding หาย** — `@rolldown/binding-win32-x64-msvc@1.0.0-rc.12` (optionalDependency
   ของ rolldown ที่ vitest 4 ต้องใช้) อยู่ใน `pnpm-lock.yaml` แต่ไม่เคยถูกติดตั้งลงดิสก์
   แก้ด้วย `pnpm install --force`
2. **ESM/CJS ไม่ตรงกัน** — `package.json` ไม่มี `"type": "module"` ทำให้ `vitest.config.ts`
   ถูกโหลดแบบ CommonJS → Vite `require()` เข้า CJS entry ของ vitest → entry นั้น `require()`
   `std-env` v4 ที่เป็น ESM-only → Node 20.14 ยังไม่รองรับ `require(esm)` จึงโยน
   `ERR_REQUIRE_ESM` แก้ด้วยการเปลี่ยนชื่อไฟล์เป็น `vitest.config.mts` (บังคับใช้ ESM loader)
   **ห้ามเปลี่ยนกลับเป็น `.ts`**
