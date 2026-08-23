# Phase 4 Instruction: กลุ่ม (PlanGroup) และแผนงานหลายชุด (Plan)

เอกสารนี้คือ spec สำหรับ phase ถัดไปต่อจาก Phase 3 (task detail ครบ + ระบบจัดการหัวข้อ/คอลัมน์)
ใช้เป็น source of truth สำหรับการทำ `กลุ่มของฉัน` และ `แผนงาน` ตาม mockup
`Planner_v2__Apple/Planner v2.dc.html`

**phase นี้แตะ schema เป็นครั้งแรกนับจาก Phase 2** — ต้องอนุมัติ schema ก่อนเริ่ม implement
ตามข้อกำหนดใน `prisma/Instruction-task.md` §10

---

## 1. คำศัพท์และโครงสร้าง

โครงสร้างที่ mockup ต้องการ (4 ชั้น):

```text
Organization            = เวิร์กสเปซ  (mockup: "ทั้งเวิร์กสเปซ")
└─ PlanGroup            = กลุ่ม       (mockup: "กลุ่มของฉัน" — การตลาด Q3, พัฒนาสินค้า, ฝ่ายขาย)
   └─ Plan              = แผนงาน      (mockup: "แผนงาน" — เปิดตัวแคมเปญ Q3, สปรินต์ 12, …)
      └─ Group          = หัวข้อ/คอลัมน์ (มีอยู่แล้ว)
         └─ TaskItem    = การ์ด        (มีอยู่แล้ว)
            └─ Subtask  = งานย่อย      (มีอยู่แล้ว)
```

> ⚠️ **กับดักเรื่องชื่อ — อ่านก่อนเขียนโค้ด**
> `Group` ใน schema ปัจจุบัน **คือคอลัมน์** ไม่ใช่ "กลุ่ม" ของ mockup
> ห้าม rename `Group` → `Column` ใน phase นี้: มันถูกอ้างด้วย composite FK
> (`[groupId, organizationId]`) จาก `TaskItem` และมีโค้ดอ้างถึงกว่า 20 ไฟล์
> "กลุ่ม" ของ mockup จึงใช้ชื่อ **`PlanGroup`** และ "แผนงาน" ใช้ **`Plan`**

ปัจจุบันเรามี 2 ชั้นกลางหายไป: `Organization → Group` ตรง ๆ (1 board ต่อ 1 organization)
ซึ่งเป็นข้อ deferred ที่ระบุไว้ใน `Instruction-task-page.md` §5

---

## 2. Schema ที่ต้องเพิ่ม/แก้

### 2.1 model ใหม่ — `prisma/schemas/plan.prisma`

```prisma
model PlanGroup {
  id             String @id @default(cuid())
  organizationId String

  name        String
  description String?
  color       String?   // palette key — lib/shared/group-colors.ts
  icon        String?
  sortOrder   Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plans        Plan[]

  @@unique([organizationId, name])
  @@unique([id, organizationId])   // composite tenant key สำหรับ Plan
  @@index([organizationId, sortOrder])
  @@map("plan_groups")
}

model Plan {
  id             String  @id @default(cuid())
  organizationId String
  planGroupId    String?              // null = แผนงานที่ยังไม่อยู่กลุ่มไหน

  name      String
  color     String?
  sortOrder Int     @default(0)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? @db.Timestamptz(6)   // soft delete — ให้ Trash รองรับได้

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  planGroup    PlanGroup?   @relation(fields: [planGroupId, organizationId], references: [id, organizationId], onDelete: SetNull)
  groups       Group[]

  @@unique([organizationId, name])
  @@unique([id, organizationId])   // composite tenant key สำหรับ Group
  @@index([organizationId, planGroupId, sortOrder])
  @@map("plans")
}
```

`planGroupId` เป็น nullable โดยตั้งใจ: mockup มีทั้งแผนงานที่อยู่ในกลุ่มและที่อยู่เดี่ยว ๆ
และทำให้ migration ไม่ต้องสร้างกลุ่มปลอมให้ข้อมูลเดิม

### 2.2 แก้ `Group` (คอลัมน์)

```prisma
model Group {
  // เพิ่ม
  planId String
  plan   Plan @relation(fields: [planId, organizationId], references: [id, organizationId], onDelete: Cascade)

  // เปลี่ยน: ชื่อคอลัมน์ต้องไม่ซ้ำ "ภายในแผนงานเดียวกัน" ไม่ใช่ทั้ง organization
  // @@unique([organizationId, name])   ← ลบ
  @@unique([planId, name])              // ← ใส่แทน
  @@index([planId, sortOrder])          // ← แทน [organizationId, sortOrder]
}
```

`@@unique([id, organizationId])` ของ `Group` **ต้องคงไว้** เพราะ `TaskItem.group` อ้างผ่านมัน
(FK เดิมไม่ต้องแก้เลย — การ์ดยังผูกกับคอลัมน์เหมือนเดิม)

### 2.3 แก้ `TaskActivity` — จำเป็นต่อ activity feed ระดับกลุ่ม

mockup หน้ากลุ่มมีการ์ด `กิจกรรมในกลุ่ม` (7 รายการล่าสุดของทุกแผนงานในกลุ่มนั้น)
แต่ `TaskActivity` **ตั้งใจไม่มี FK ไป TaskItem** เพื่อให้ history อยู่รอดหลังการ์ดถูกลบ
(`prisma/Instruction-task.md` §7) ⇒ **join กลับไปหาแผนงานไม่ได้** ต้อง denormalize:

```prisma
model TaskActivity {
  planId            String?   // denormalized — filter activity ตามแผนงาน/กลุ่ม
  planNameSnapshot  String?   // ชื่อแผนงาน ณ ตอนเกิดเหตุ (mockup แสดงคอลัมน์ "แผนงาน")

  @@index([organizationId, planId, createdAt(sort: Desc)])
}
```

nullable เพราะแถวเก่าไม่มีค่า — ทุกฟังก์ชันใน `board.service.ts` ที่เขียน `TaskActivity`
(15 จุด) ต้องส่ง `planId`/`planNameSnapshot` เพิ่ม

### 2.4 enum ที่ต้องเพิ่มใน `ActivityAction`

Phase 3 เลี่ยงการ log group mutation ไปเพราะ enum ไม่มีค่าที่ตรง — phase นี้เติมได้:

```prisma
enum ActivityAction {
  // เดิม 15 ค่า …
  GROUP_CREATED
  GROUP_RENAMED
  GROUP_RECOLORED
  GROUP_DELETED
  GROUP_REORDERED
  PLAN_CREATED
  PLAN_RENAMED
  PLAN_DELETED
}
```

⚠️ ถ้าเติมค่าเหล่านี้ ต้องทำ 3 อย่างพร้อมกัน:
1. `TaskActivity.taskItemId` ต้องเปลี่ยนเป็น **nullable** (event ระดับคอลัมน์/แผนงานไม่มีการ์ด)
2. `types/planner.ts` → `ActivityActionValue` เติมค่าใหม่
3. `components/TaskDetail/activityFormat.ts` เติม label (switch เป็น exhaustive อยู่ ถ้าไม่เติมจะ compile error ทันที — ดีแล้ว)

---

## 3. Migration (ข้อมูลเดิมต้องไม่พัง)

ทุก organization ที่มีอยู่มีคอลัมน์ผูกกับ `organizationId` ตรง ๆ ต้อง backfill เป็น 3 ขั้น
ห้ามรวบเป็น migration เดียวที่ตั้ง `planId` เป็น required ทันที:

1. **เพิ่มแบบ nullable** — `Plan`, `PlanGroup`, `Group.planId String?`, `TaskActivity.planId`
2. **Backfill** — สร้าง `Plan` ชื่อ `"แผนงานหลัก"` 1 ใบต่อ organization แล้ว
   `UPDATE groups SET "planId" = <plan.id>` ตาม organization; เติม `TaskActivity.planId` จาก
   `taskItemId → task_items.groupId → groups.planId` (แถวที่การ์ดถูก purge ไปแล้วปล่อยเป็น null)
3. **บังคับ required + สลับ unique** — `Group.planId String`, ลบ `@@unique([organizationId, name])`
   ใส่ `@@unique([planId, name])`

`services/organization.service.ts` → `getOrCreateDefaultOrganization` ต้องสร้าง `Plan` เริ่มต้น
พร้อมกับ 3 คอลัมน์ (`DEFAULT_GROUPS`) ในทรานแซกชันเดียวกัน

---

## 4. Service layer

| ฟังก์ชันใหม่ (`services/plan.service.ts`) | หมายเหตุ |
|---|---|
| `listPlanGroups(organizationId)` | + จำนวนแผนงานในแต่ละกลุ่ม (badge ใน sidebar) |
| `createPlanGroup(organizationId, name, color)` | ชื่อซ้ำ → `Duplicate entry` |
| `updatePlanGroup(organizationId, id, patch)` | ชื่อ/สี/ไอคอน — pattern เดียวกับ `updateGroup` |
| `deletePlanGroup(organizationId, id)` | `onDelete: SetNull` ⇒ แผนงานในกลุ่มไม่ถูกลบ แค่หลุดกลุ่ม |
| `listPlans(organizationId, planGroupId?)` | + counters: จำนวนการ์ด, % เสร็จ, chip ต่อคอลัมน์ |
| `createPlan(organizationId, name, planGroupId?)` | สร้างคอลัมน์เริ่มต้น 3 ใบให้ด้วย (เหมือน org ใหม่) |
| `updatePlan` / `movePlanToGroup` / `deletePlan` (soft) | |
| `getPlanGroupOverview(organizationId, planGroupId)` | ข้อมูลทั้งหน้า §5.2 ในรอบเดียว |
| `listPlanGroupActivity(organizationId, planGroupId, page)` | ใช้ index `[organizationId, planId, createdAt]` |

ฟังก์ชันเดิมใน `board.service.ts` ที่ต้องรับ `planId` เพิ่ม:
`getBoard`, `listGroups`, `createGroup`, `reorderGroups` (scope ต่อแผนงาน ไม่ใช่ต่อ organization)
ส่วน `deleteGroup` ต้องเช็ค "เหลือคอลัมน์เดียว" **ภายในแผนงานนั้น** ไม่ใช่ทั้ง organization

> `createTask`, `moveTask`, `updateTask*`, `*Subtask*`, `deleteTask`, `restoreTask` **ไม่ต้องแก้ signature**
> เพราะ scope ด้วย `taskId` + `organizationId` อยู่แล้ว — แต่ทุกตัวที่เขียน `TaskActivity`
> ต้องหา `planId` ของการ์ดมาใส่ (query เพิ่ม 1 ครั้ง หรือ select ผ่าน `group.planId` ใน select เดิม)

---

## 5. Route และหน้าจอ

### 5.1 URL scheme

```text
/board                          → redirect ไปแผนงานล่าสุด/แผนงานแรก (ของเดิมไม่พัง)
/plans/[planId]                 → board 4 มุมมองของแผนงานนั้น (ย้ายจาก /board)
/groups/[planGroupId]           → หน้าภาพรวมกลุ่ม (ใหม่)
/board/tasks/[taskId]           → คงเดิม (taskId เป็น global ไม่ผูกแผนงาน)
/board/trash                    → คงเดิม แต่เพิ่มคอลัมน์ "แผนงาน" ในตาราง
```

เพิ่ม prefix `/plans` และ `/groups` ใน `PROTECTED_ROUTE_PREFIXES` (`middleware.ts`)

### 5.2 หน้าภาพรวมกลุ่ม (mockup บรรทัด ~430–470)

- หัวเรื่อง: `{group.name}` / subtitle `{n} แผนงาน · {m} สมาชิก`
- Grid 2 คอลัมน์ของการ์ดแผนงาน: สี่เหลี่ยมสี, ชื่อ, `{n} งาน · {pct}%`, progress bar,
  chip ต่อคอลัมน์ `{colName} {count}` — คลิกเข้า `/plans/[planId]`
- การ์ด `สมาชิกในกลุ่มนี้`: avatar, ชื่อ, role, `{n} งานค้าง`
- การ์ด `กิจกรรมในกลุ่ม`: 7 รายการล่าสุดจากทุกแผนงานในกลุ่ม

### 5.3 Sidebar (`components/PlannerShell/PlannerSidebar.tsx`)

เพิ่ม 2 section ตาม mockup — `กลุ่มของฉัน` (badge = จำนวนแผนงาน) และ `แผนงาน` (badge = จำนวนการ์ด)
ใช้ `useSWR`-like hook ใหม่ `hooks/usePlanNav.ts` เรียก `GET /api/plans/nav` ครั้งเดียวต่อ session

---

## 6. ลำดับงานที่แนะนำ (แต่ละขั้นจบแล้ว repo ต้องเขียว)

| # | ขั้น | ขนาด |
|---|---|---|
| 1 | schema + migration 3 ขั้น + `db:generate` + แก้ `organization.service` | L |
| 2 | `plan.service.ts` + tests (Plan CRUD, PlanGroup CRUD) | L |
| 3 | ปรับ `board.service` ให้ scope ด้วย `planId` + แก้ tests เดิม | M |
| 4 | routes `/api/plans/**`, `/api/plan-groups/**` | M |
| 5 | ย้าย `/board` → `/plans/[planId]` + redirect + sidebar nav | M |
| 6 | หน้าภาพรวมกลุ่ม `/groups/[planGroupId]` | L |
| 7 | เติม `GROUP_*`/`PLAN_*` ใน ActivityAction + log group mutation ที่ Phase 3 ค้างไว้ | S |

---

## 7. ยังไม่ทำใน phase นี้

- **สมาชิกระดับกลุ่ม** (`PlanGroupMember`) — v1 ให้ทุกคนใน organization เห็นทุกกลุ่ม
  ส่วนการ์ด `สมาชิกในกลุ่มนี้` derive จาก assignee ของการ์ดในกลุ่มนั้น + org members
- Access Groups / permission matrix — ยังใช้ `lib/shared/role-helpers.ts` เดิม
- Attachment, Comment, human-readable task ID (`T-102`) — ยังต้องมี model แยก
- Template (สร้างแผนงานจากชุดคอลัมน์สำเร็จรูป) — ทำได้หลังมี `Plan` แล้ว เป็น phase ถัดไป
- Drag คอลัมน์ข้ามแผนงาน

---

## 8. คำสั่งตรวจงาน

```bash
pnpm schema:merge && pnpm schema:format && pnpm db:generate
pnpm type-check
pnpm test
pnpm build
pnpm dev
```

`db:push` / `migrate` ให้รันเมื่ออนุมัติ schema ในข้อ 2 แล้วเท่านั้น
