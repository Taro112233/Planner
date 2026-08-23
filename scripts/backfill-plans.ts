// scripts/backfill-plans.ts
// Step 2 of the Plan/PlanGroup migration (Instruction-group.md §3).
//
// Before this runs, Group.planId and TaskActivity.planId exist but are null
// everywhere: the schema used to hang columns straight off Organization. This
// gives every organization one Plan and points its existing columns and
// activity rows at it. Only then can step 3 make Group.planId required.
//
//   pnpm tsx scripts/backfill-plans.ts            # dry run — reads only
//   pnpm tsx scripts/backfill-plans.ts --apply    # writes
//
// Idempotent: re-running finds the plan it already created and updates nothing.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Name given to the plan that adopts an organization's pre-existing board. */
const DEFAULT_PLAN_NAME = 'แผนงานหลัก';

const apply = process.argv.includes('--apply');

async function main() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { groups: true, activities: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const orphanGroups = await prisma.group.count({ where: { planId: null } });
  const orphanActivities = await prisma.taskActivity.count({ where: { planId: null } });

  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — plan backfill`);
  console.log(`  organizations:            ${organizations.length}`);
  console.log(`  columns without a plan:   ${orphanGroups}`);
  console.log(`  activity without a plan:  ${orphanActivities}`);
  console.log('');

  for (const organization of organizations) {
    const existing = await prisma.plan.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    const label = `${organization.name} (${organization.id})`;
    if (!apply) {
      console.log(
        existing
          ? `  ${label}: already has plan "${existing.name}" — would attach ${organization._count.groups} column(s)`
          : `  ${label}: would create plan "${DEFAULT_PLAN_NAME}" and attach ${organization._count.groups} column(s), ${organization._count.activities} activity row(s)`
      );
      continue;
    }

    const plan =
      existing ??
      (await prisma.plan.create({
        data: { organizationId: organization.id, name: DEFAULT_PLAN_NAME, sortOrder: 0 },
        select: { id: true, name: true },
      }));

    // Every column an organization owns today belongs to its one plan.
    const groups = await prisma.group.updateMany({
      where: { organizationId: organization.id, planId: null },
      data: { planId: plan.id },
    });

    // Same for activity. Rows whose TaskItem was already purged are included
    // deliberately — they belong to that plan's history even though the
    // missing TaskItem FK means they can no longer be joined to it.
    const activities = await prisma.taskActivity.updateMany({
      where: { organizationId: organization.id, planId: null },
      data: { planId: plan.id, planNameSnapshot: plan.name },
    });

    console.log(
      `  ${label}: plan "${plan.name}" — ${groups.count} column(s), ${activities.count} activity row(s)`
    );
  }

  if (!apply) {
    console.log('\nNothing was written. Re-run with --apply to perform the backfill.');
  }
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
