// services/report.service.ts
// Report Service — Layer 2 (Business Logic + Database)
// Backs "รายงาน": workload per member, cards per column across every plan,
// who ticks the most, and ticks per day for the last week.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { ReportDto } from '@/types/planner';

/** How far back "who ticks the most" looks. */
export const TICKER_WINDOW_DAYS = 30;
const DAYS_IN_CHART = 7;

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** Local-date key, so a tick at 23:30 lands on the day it happened here. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * @param planGroupId  Limit everything to this group's plans; omit for the
 *                     whole workspace.
 */
export async function getReport(
  organizationId: string,
  now = new Date(),
  planGroupId?: string
): Promise<ReportDto> {
  const chartStart = startOfDay(now);
  chartStart.setDate(chartStart.getDate() - (DAYS_IN_CHART - 1));
  const tickerStart = new Date(now);
  tickerStart.setDate(tickerStart.getDate() - TICKER_WINDOW_DAYS);

  // Plans first: in a group scope, ticks are matched by their plan ids.
  const plans = await prisma.plan.findMany({
    where: { organizationId, deletedAt: null, ...(planGroupId ? { planGroupId } : {}) },
    select: {
      id: true,
      groups: { orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, color: true } },
    },
  });

  const [members, tasks, ticks] = await Promise.all([
    prisma.organizationUser.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        // A group's report covers the people in that group.
        ...(planGroupId ? { planGroupMembers: { some: { planGroupId } } } : {}),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, user: { select: { image: true } } },
    }),
    prisma.taskItem.findMany({
      where: {
        organizationId,
        deletedAt: null,
        group: { planId: { in: plans.map((plan) => plan.id) } },
      },
      select: { groupId: true, assignees: { select: { organizationUserId: true } } },
    }),
    prisma.taskActivity.findMany({
      where: {
        organizationId,
        action: 'SUBTASK_CHECKED',
        createdAt: { gte: tickerStart < chartStart ? tickerStart : chartStart },
        ...(planGroupId ? { planId: { in: plans.map((plan) => plan.id) } } : {}),
      },
      select: { actorId: true, actorNameSnapshot: true, actorAvatarSnapshot: true, createdAt: true },
    }),
  ]);

  // A card is done when it sits in its plan's last column — the rule
  // listPlans and the home page use.
  const doneGroupIds = new Set<string>();
  const columnById = new Map<string, { name: string; color: string | null }>();
  plans.forEach((plan) => {
    plan.groups.forEach((group) => columnById.set(group.id, group));
    const last = plan.groups[plan.groups.length - 1];
    if (last) doneGroupIds.add(last.id);
  });

  // Workload: open cards per assignee.
  const openByMember = new Map<string, number>();
  tasks.forEach((task) => {
    if (doneGroupIds.has(task.groupId)) return;
    task.assignees.forEach(({ organizationUserId }) => {
      openByMember.set(organizationUserId, (openByMember.get(organizationUserId) ?? 0) + 1);
    });
  });
  const workload = members
    .map((member) => ({
      organizationUserId: member.id,
      name: `${member.firstName} ${member.lastName}`.trim(),
      avatarUrl: member.user.image ?? null,
      openCount: openByMember.get(member.id) ?? 0,
    }))
    .sort((a, b) => b.openCount - a.openCount);

  // Columns share names across plans ("To Do" in each), so group by name.
  const byColumnName = new Map<string, { name: string; color: string | null; count: number }>();
  tasks.forEach((task) => {
    const column = columnById.get(task.groupId);
    if (!column) return;
    const entry = byColumnName.get(column.name) ?? { name: column.name, color: column.color, count: 0 };
    entry.count += 1;
    byColumnName.set(column.name, entry);
  });
  const columns = [...byColumnName.values()].sort((a, b) => b.count - a.count);

  // Top tickers over the window, and ticks per day for the chart.
  const tickers = new Map<string, { name: string; avatarUrl: string | null; count: number }>();
  const perDay = new Map<string, number>();
  ticks.forEach((tick) => {
    if (tick.createdAt >= tickerStart) {
      const entry = tickers.get(tick.actorId) ?? {
        name: tick.actorNameSnapshot,
        avatarUrl: tick.actorAvatarSnapshot ?? null,
        count: 0,
      };
      entry.count += 1;
      tickers.set(tick.actorId, entry);
    }
    if (tick.createdAt >= chartStart) {
      const key = dayKey(tick.createdAt);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
  });

  const daily = Array.from({ length: DAYS_IN_CHART }, (_, index) => {
    const day = new Date(chartStart);
    day.setDate(chartStart.getDate() + index);
    return { date: day.toISOString(), count: perDay.get(dayKey(day)) ?? 0 };
  });

  return {
    workload,
    columns,
    topTickers: [...tickers.entries()]
      .map(([organizationUserId, entry]) => ({ organizationUserId, ...entry }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    dailyTicks: daily,
    tickerWindowDays: TICKER_WINDOW_DAYS,
  };
}
