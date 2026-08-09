# Current Schema Instruction: TaskItem, Subtask และ Activity

เอกสารนี้คือข้อกำหนดฉบับปัจจุบันที่ adapt จาก instruction เดิมให้เข้ากับ
schema base ของ Planner repository นี้ ใช้เป็น source of truth สำหรับงาน schema
ที่เกี่ยวกับ Card, งานย่อย, assignment และ activity history

ขอบเขตปัจจุบันเป็น **schema only** ยังไม่อนุญาตให้สร้าง API, service, admin UI,
trigger, migration หรือ seed จนกว่าจะมีคำสั่งแยกต่างหาก

## 1. คำศัพท์และโครงสร้าง

```text
Organization
└─ Group (Kanban column)
   └─ TaskItem (Card — assign ได้)
      └─ Subtask depth = 0
         └─ Subtask depth = 1
            └─ Subtask depth = 2
```

- `TaskItem` คือ Card ระดับบน
- `Subtask` เป็นคนละ entity และคนละ table กับ `TaskItem`
- `Subtask` เป็น adjacency-list tree ลึกสุด 3 ชั้น (`depth` 0, 1, 2)
- Assignment มีเฉพาะระดับ `TaskItem` ผ่าน `TaskAssignee`
- `Subtask` ไม่มี assignee, status, priority, badge, start date หรือ due date
- ผู้ติ๊ก Subtask (`checkedBy`) คือผู้กระทำ ไม่ใช่ assignee
- ห้ามนำ Subtask กลับไปเก็บเป็น JSON ใน TaskItem

## 2. การ adapt เข้ากับ base เดิม

- ใช้ `Organization` และ `Group` ที่มีอยู่เดิม แทนการเพิ่ม `Plan` ที่ยังไม่มีในโดเมน
- ใช้ `TaskStatus` และ `TaskPriority` enum แทน configurable Status model ในระยะนี้
- เพิ่ม `TaskBadge` และ `TaskItemBadge` สำหรับ badge ระดับ Card
- ใช้ `cuid()` เหมือน Better Auth และ base schema เดิม ห้ามผสม `@db.Uuid`
  กับ ID แบบ CUID ใน foreign key
- `User.role` เป็น role ระดับเว็บ ส่วน `OrganizationUser.role` เป็น role ภายในองค์กร
- Prisma ใช้ native multi-file schema จาก `prisma/schemas/` ผ่าน `prisma.config.ts`

## 3. OrganizationUser

`OrganizationUser` เป็น membership ระหว่าง User กับ Organization และเป็น identity
ที่ใช้อ้าง actor/assignee ในข้อมูลขององค์กร

กฎสำคัญ:

- หนึ่ง User มี membership ได้หลาย Organization
- หนึ่ง User มี membership ซ้ำใน Organization เดิมไม่ได้
- actor และ assignee ต้องมาจาก Organization เดียวกับ TaskItem
- การออกจากองค์กรใช้ `status = LEFT` และ `leftAt`; ไม่ hard-delete membership
- `UserRole` และ `OrganizationRole` ต้องไม่ใช้แทนกัน

Role เริ่มต้น:

```text
OWNER
ADMIN
MEMBER
```

## 4. TaskItem และ Assignment

`TaskItem` เป็น Card ที่อยู่ใน Group และมีข้อมูลระดับงาน ได้แก่ title,
description, status, priority, position, start/due date, badge และ counters

Assignment ใช้ join table `TaskAssignee`:

- Card หนึ่งใบมี assignee ได้หลายคน
- สมาชิกคนเดิมถูก assign ซ้ำใน Card เดิมไม่ได้
- เก็บทั้งผู้ถูก assign, ผู้ที่ทำการ assign และเวลาที่ assign
- relation แบบ composite ต้องรับประกันว่า TaskItem, assignee และ assignedBy
  อยู่ใน Organization เดียวกัน

ไม่มี `assigneeId` บน `TaskItem` และไม่มี assignment field บน `Subtask`

## 5. Subtask tree

Subtask มีเฉพาะข้อมูลที่จำเป็นต่อ checklist:

- title
- isDone
- checkedBy และ checkedAt
- checkedBy name/avatar snapshot สำหรับสถานะปัจจุบัน
- parentSubtaskId
- depth 0..2
- Decimal position
- direct-child counters
- createdBy และ timestamps
- version สำหรับ optimistic concurrency

Composite parent relation ต้องรับประกันว่า parent และ child อยู่ใน TaskItem เดียวกัน

### Invariants

| ID | เงื่อนไข |
|---|---|
| I1 | root มี `depth = 0`; child มี `depth = parent.depth + 1` |
| I2 | `depth` อยู่ในช่วง 0..2 เท่านั้น |
| I3 | parent และ child ต้องมี `taskItemId` เดียวกัน |
| I4 | `childTotal`/`childDone` นับลูกตรงเท่านั้น |
| I5 | node ที่มีลูกจะ done ก็ต่อเมื่อลูกตรง done ครบ |
| I6 | TaskItem counters นับเฉพาะ root Subtask (`depth = 0`) |
| I7 | `isDone = false` ต้องล้าง checkedBy/snapshot/checkedAt |
| I8 | การเปลี่ยนหลายแถวจาก action เดียวต้อง atomic |

Schema และ CHECK constraint ปกติบังคับ I1 ซึ่งต้องอ่าน parent row ไม่ได้ จึงต้อง
เลือก DB trigger หรือ service จุดเดียวในขั้น implementation ภายหลัง และห้ามผสม
สองแนวทางในการ maintain counters

## 6. Concurrent editing

การแยก Subtask เป็น table ทำให้ผู้ใช้สองคนแก้คนละ node พร้อมกันได้โดยไม่เขียนทับ
tree ทั้งก้อน แต่ถ้าแก้ node เดียวกันให้ใช้ `version` เป็น optimistic concurrency token

Checkbox mutation ควรส่ง desired state (`isDone = true/false`) ไม่ใช้ blind toggle

`position` ใช้ `Decimal(20, 10)` สำหรับ fractional indexing และต้องมีการ rebalance
เมื่อช่องว่างของเลขเหลือน้อยในอนาคต

## 7. Activity และ snapshot

`TaskActivity` เป็น append-only history สำหรับตอบว่าใครทำอะไรกับข้อมูลใดเมื่อใด

ข้อมูล actor ที่ต้อง snapshot ทุก event:

- actor OrganizationUser ID
- global User ID ณ ตอนเกิดเหตุ
- display name
- avatar ถ้ามี
- OrganizationRole ณ ตอนเกิดเหตุ

ข้อมูล target ที่ต้อง snapshot:

- TaskItem ID และชื่อ Card
- Subtask ID และชื่อ ถ้า event เกี่ยวข้องกับ Subtask
- before/after/context ใน `changes` JSON

`taskItemId` และ `subtaskId` ใน Activity เป็น historical identifiers โดยตั้งใจไม่มี
foreign key เพื่อให้ history อยู่รอดหลัง target ถูกลบ ส่วน actor ใช้ relation กับ
OrganizationUser ซึ่งเก็บแบบ soft-left

ทุก event จาก user action เดียวกันใช้ `batchId` เดียวกัน และบันทึกเฉพาะ row ที่
เปลี่ยนจริง เพื่อให้ UI รวม event เป็นหนึ่งรายการแล้วขยายดูรายละเอียดได้

## 8. Behavior contract สำหรับ implementation ภายหลัง

- Check node: cascade ลงเฉพาะ descendant ที่ยังไม่ done
- Uncheck node: cascade ลงเฉพาะ descendant ที่ done และล้าง checker fields
- เมื่อ direct children ครบ: recompute แม่ขึ้นด้านบน
- เมื่อ child ถูก uncheck: recompute แม่ขึ้นด้านบนโดยห้าม cascade ลงอีกครั้ง
- เพิ่ม child ใต้แม่ที่ done: แม่ต้องกลับเป็น not done และ recompute ขึ้น
- ลบ node: descendants ถูก cascade delete แล้ว recompute แม่เก่าและ counters
- ย้าย subtree: update depth ทั้ง subtree, ปฏิเสธถ้าลึกเกิน 2 และ recompute
  counters ของ parent เก่า/ใหม่
- ทุก mutation ที่กระทบหลาย row, counters และ Activity ต้องอยู่ transaction เดียว

หัวข้อนี้เป็น contract เท่านั้น ยังไม่มีการสร้าง service/trigger ในงาน schema รอบนี้

## 9. Deferred PostgreSQL constraints

คำสั่งต่อไปนี้เก็บไว้เป็น comment ตามขอบเขตปัจจุบัน ยังไม่ใช่ migration ที่ถูก apply:

```sql
-- ALTER TABLE "subtasks"
--   ADD CONSTRAINT "chk_subtask_depth"
--   CHECK ("depth" BETWEEN 0 AND 2);

-- ALTER TABLE "subtasks"
--   ADD CONSTRAINT "chk_subtask_not_self_parent"
--   CHECK ("id" <> "parentSubtaskId");

-- ALTER TABLE "subtasks"
--   ADD CONSTRAINT "chk_subtask_done_consistency"
--   CHECK (
--     ("isDone" = false
--       AND "checkedById" IS NULL
--       AND "checkedByNameSnapshot" IS NULL
--       AND "checkedByAvatarSnapshot" IS NULL
--       AND "checkedAt" IS NULL)
--     OR
--     ("isDone" = true
--       AND "checkedById" IS NOT NULL
--       AND "checkedByNameSnapshot" IS NOT NULL
--       AND "checkedAt" IS NOT NULL)
--   );

-- ALTER TABLE "subtasks"
--   ADD CONSTRAINT "chk_subtask_counters"
--   CHECK (
--     "childTotal" >= 0
--     AND "childDone" >= 0
--     AND "childDone" <= "childTotal"
--   );

-- ALTER TABLE "task_items"
--   ADD CONSTRAINT "chk_task_item_counters"
--   CHECK (
--     "subtaskTotal" >= 0
--     AND "subtaskDone" >= 0
--     AND "subtaskDone" <= "subtaskTotal"
--   );
```

Trigger สำหรับ I1, auto-complete parent และ counter maintenance ให้เขียนเมื่อเลือก
แนวทาง DB-trigger อย่างเป็นทางการเท่านั้น

## 10. Schema files และคำสั่งที่อนุญาตในระยะนี้

```text
prisma/schemas/schema.prisma
prisma/schemas/base.prisma
prisma/schemas/better-auth.prisma
prisma/schemas/organization-user.prisma
prisma/schemas/planner.prisma
prisma/schemas/task-item.prisma
```

คำสั่งตรวจ schema ที่ไม่แก้ฐานข้อมูล:

```bash
pnpm schema:format
pnpm schema:check
pnpm db:generate
```

ยังไม่ให้รัน `db:push`, `migrate`, reset หรือ seed จนกว่าจะอนุมัติ schema และสร้าง
migration/seed อย่างตั้งใจ โดย seed configuration ถูกเก็บเป็น comment ใน
`prisma.config.ts`
