// scripts/load-test/run.mjs
// 50 members working in one shared group at the same moment, against a real
// server and the real database.
//
//   node scripts/load-test/run.mjs [baseUrl] [users] [rounds]
//   defaults: http://localhost:3100 50 3
//
// Setup (idempotent — safe to re-run):
//   · owner account  planner.demo@planner.test
//   · member accounts loadtest01…NN@planner.test
//   · all share PASSWORD below
//   · the owner's group "ทดสอบโหลด 50 คน" with plan "บอร์ดทดสอบโหลด";
//     every member joins it with the group's join code
//
// Load: every member, all at once, runs `rounds` rounds of what a person does
// in the app — open home, the sidebar's lists, the board; add a card, add a
// subtask, tick it, move the card; open the group's report.
//
// Then integrity checks on the board the owner sees: every card created is
// there exactly once, in the column it was moved to, with its subtask
// counted as done.
//
// Run it against a server with ARCJET_ENABLED=false: Arcjet's limit is per IP
// as Arcjet sees it, and every simulated member here really comes from this
// machine. Each member does send its own X-Forwarded-For, which is what
// Better Auth's sign-in limit (3 per 10 s per IP) keys on.

const BASE = process.argv[2] ?? 'http://localhost:3100';
const USERS = Number(process.argv[3] ?? 50);
const ROUNDS = Number(process.argv[4] ?? 3);
export const PASSWORD = 'PlannerTest#2026';
const OWNER_EMAIL = 'planner.demo@planner.test';
const GROUP_NAME = 'ทดสอบโหลด 50 คน';
const PLAN_NAME = 'บอร์ดทดสอบโหลด';
const RUN = Date.now().toString(36);

// ── tiny HTTP client with a cookie jar per user ──────────────────────────

let nextIp = 1;

class Client {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
    // Each simulated person gets their own address, as 50 people on their
    // own connections would. Better Auth limits sign-in to 3 per 10 s per IP.
    this.ip = `10.50.0.${nextIp++}`;
  }

  async call(method, path, body, metric) {
    const started = performance.now();
    let status = 0;
    try {
      const response = await fetch(BASE + path, {
        method,
        headers: {
          'content-type': 'application/json',
          origin: BASE,
          'x-forwarded-for': this.ip,
          cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });
      status = response.status;
      for (const raw of response.headers.getSetCookie()) {
        const [pair] = raw.split(';');
        const index = pair.indexOf('=');
        this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
      }
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* not JSON */
      }
      return { status, json };
    } catch (error) {
      return { status: 0, json: { error: String(error) } };
    } finally {
      if (metric) record(metric, performance.now() - started, status);
    }
  }
}

// ── metrics ──────────────────────────────────────────────────────────────

const metrics = new Map();
function record(name, ms, status) {
  const entry = metrics.get(name) ?? { times: [], statuses: new Map() };
  entry.times.push(ms);
  entry.statuses.set(status, (entry.statuses.get(status) ?? 0) + 1);
  metrics.set(name, entry);
}
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

function report() {
  const rows = [...metrics].map(([name, { times, statuses }]) => {
    const sorted = [...times].sort((a, b) => a - b);
    const ok = [...statuses].filter(([s]) => s >= 200 && s < 300).reduce((n, [, c]) => n + c, 0);
    return {
      endpoint: name,
      requests: times.length,
      ok,
      failed: times.length - ok,
      p50_ms: Math.round(pct(sorted, 50)),
      p95_ms: Math.round(pct(sorted, 95)),
      max_ms: Math.round(sorted[sorted.length - 1]),
      statuses: [...statuses].map(([s, c]) => `${s}×${c}`).join(' '),
    };
  });
  console.table(rows);
  return rows;
}

// ── setup ────────────────────────────────────────────────────────────────

async function signIn(client, email, firstName, lastName) {
  let res = await client.call('POST', '/api/auth/sign-in/email', { email, password: PASSWORD });
  if (res.status === 200) return;
  res = await client.call('POST', '/api/auth/sign-up/email', {
    email,
    password: PASSWORD,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
  });
  if (res.status !== 200) throw new Error(`sign-up ${email}: ${res.status} ${JSON.stringify(res.json)}`);
}

async function must(promise, what) {
  const res = await promise;
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${what}: ${res.status} ${JSON.stringify(res.json)}`);
  }
  return res.json.data;
}

async function setup() {
  const owner = new Client('owner');
  await signIn(owner, OWNER_EMAIL, 'Demo', 'Owner');
  // First request provisions the owner's workspace.
  await must(owner.call('GET', '/api/home'), 'owner home');

  const groups = await must(owner.call('GET', '/api/plan-groups'), 'list groups');
  let group = groups.find((g) => g.name === GROUP_NAME);
  if (!group) {
    group = await must(owner.call('POST', '/api/plan-groups', { name: GROUP_NAME, color: 'blue' }), 'create group');
  }

  const plans = await must(owner.call('GET', `/api/plans?planGroupId=${group.id}`), 'list plans');
  let plan = plans.find((p) => p.name === PLAN_NAME);
  if (!plan) {
    plan = await must(
      owner.call('POST', '/api/plans', { name: PLAN_NAME, planGroupId: group.id, templateId: 'sprint' }),
      'create plan'
    );
  }

  let settings = await must(owner.call('POST', `/api/plan-groups/${group.id}/join-code`), 'join code');
  settings = await must(
    owner.call('PATCH', `/api/plan-groups/${group.id}/join-code`, { enabled: true }),
    'enable join code'
  );

  const board = await must(owner.call('GET', `/api/board?planId=${plan.id}`), 'owner board');
  const workspace = await must(owner.call('GET', '/api/workspaces'), 'owner workspaces');

  const members = [];
  // Sign members up in batches: account creation hashes passwords (CPU).
  for (let start = 0; start < USERS; start += 10) {
    const batch = Array.from({ length: Math.min(10, USERS - start) }, (_, k) => start + k + 1);
    members.push(
      ...(await Promise.all(
        batch.map(async (n) => {
          const id = String(n).padStart(2, '0');
          const client = new Client(`member${id}`);
          await signIn(client, `loadtest${id}@planner.test`, 'Load', `Tester ${id}`);
          await must(client.call('POST', '/api/plan-groups/join', { code: settings.joinCode }), `join ${id}`);
          await must(
            client.call('POST', '/api/workspaces/active', { organizationId: workspace.activeOrganizationId }),
            `switch ${id}`
          );
          return client;
        })
      ))
    );
  }

  return { owner, group, plan, columns: board.groups.map((g) => g.id), members };
}

// ── the load ─────────────────────────────────────────────────────────────

async function memberSession(client, ctx, index) {
  const created = [];
  for (let round = 0; round < ROUNDS; round += 1) {
    await client.call('GET', '/api/home', undefined, 'GET /api/home');
    await Promise.all([
      client.call('GET', '/api/plans', undefined, 'GET /api/plans'),
      client.call('GET', '/api/plan-groups', undefined, 'GET /api/plan-groups'),
      client.call('GET', '/api/inbox', undefined, 'GET /api/inbox'),
      client.call('GET', '/api/board/members', undefined, 'GET /api/board/members'),
    ]);
    await client.call('GET', `/api/board?planId=${ctx.plan.id}`, undefined, 'GET /api/board');

    const title = `load-${RUN}-u${index}-r${round}`;
    const task = await client.call(
      'POST',
      '/api/board/tasks',
      { groupId: ctx.columns[0], title },
      'POST /api/board/tasks'
    );
    const taskId = task.json?.data?.id;
    if (!taskId) continue;
    created.push(title);

    const withSubtask = await client.call(
      'POST',
      `/api/board/tasks/${taskId}/subtasks`,
      { title: 'ตรวจ' },
      'POST …/subtasks'
    );
    const subtaskId = withSubtask.json?.data?.subtasks?.[0]?.id;
    if (subtaskId) {
      await client.call(
        'PATCH',
        `/api/board/tasks/${taskId}/subtasks/${subtaskId}`,
        { isDone: true },
        'PATCH …/subtasks/:id (tick)'
      );
    }
    await client.call(
      'PATCH',
      `/api/board/tasks/${taskId}/move`,
      { groupId: ctx.columns[1], targetIndex: 0 },
      'PATCH …/move'
    );
    await client.call('GET', `/api/reports?planGroupId=${ctx.group.id}`, undefined, 'GET /api/reports');
  }
  return created;
}

// ── main ─────────────────────────────────────────────────────────────────

const t0 = performance.now();
console.log(`Setting up ${USERS} members against ${BASE} …`);
const ctx = await setup();
console.log(`Setup done in ${((performance.now() - t0) / 1000).toFixed(1)}s. Starting load: ${USERS} members × ${ROUNDS} rounds, all at once.`);

const t1 = performance.now();
const createdPerMember = await Promise.all(ctx.members.map((m, i) => memberSession(m, ctx, i + 1)));
const seconds = (performance.now() - t1) / 1000;
const totalRequests = [...metrics.values()].reduce((n, e) => n + e.times.length, 0);
console.log(`\nLoad finished in ${seconds.toFixed(1)}s — ${totalRequests} requests (${(totalRequests / seconds).toFixed(1)} req/s)\n`);
const rows = report();

// ── integrity ────────────────────────────────────────────────────────────

const created = createdPerMember.flat();
const board = (await ctx.owner.call('GET', `/api/board?planId=${ctx.plan.id}`)).json.data;
const mine = board.groups.flatMap((g) => g.taskItems.map((t) => ({ ...t, column: g.id }))).filter((t) => t.title.startsWith(`load-${RUN}-`));
const titles = new Map();
mine.forEach((t) => titles.set(t.title, (titles.get(t.title) ?? 0) + 1));

const checks = {
  'cards created (expected)': USERS * ROUNDS,
  'cards created (server said OK)': created.length,
  'cards on the board': mine.length,
  'duplicate cards': [...titles.values()].filter((c) => c > 1).length,
  'cards not in the target column': mine.filter((t) => t.column !== ctx.columns[1]).length,
  'cards whose subtask count is wrong': mine.filter((t) => t.subtaskTotal !== 1 || t.subtaskDone !== 1).length,
  'cards sharing a position in a column': (() => {
    const seen = new Map();
    board.groups.forEach((g) => g.taskItems.forEach((t) => {
      const key = `${g.id}:${t.position}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }));
    return [...seen.values()].filter((c) => c > 1).length;
  })(),
};
console.log('\nIntegrity');
console.table(checks);

const failed = rows.reduce((n, r) => n + r.failed, 0);
console.log(
  failed === 0 && checks['cards on the board'] === USERS * ROUNDS && checks['duplicate cards'] === 0
    ? '\nRESULT: PASS'
    : '\nRESULT: ISSUES FOUND (see tables above)'
);
