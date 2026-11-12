/**
 * Put the shared guest workspace back to its demo state.
 *
 * Every "Continue as guest" visitor shares one account and can change
 * anything in it, so this removes every board the guest account owns and
 * rebuilds the demo board (./guest-demo/demo-board.ts) with its rules and
 * templates (./guest-demo/seed-automation.ts). Real users' boards
 * are never touched: the guest can't be invited and can't invite.
 *
 * Runs nightly from .github/workflows/reset-guest-demo.yml. Locally:
 *   pnpm demo:reset            (uses DATABASE_URL from .env.local)
 */

import { config as loadEnv } from 'dotenv';
import { generateNKeysBetween } from 'fractional-indexing';
import path from 'node:path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const DAY_MS = 24 * 60 * 60 * 1000;

/** n fractional-index keys in order (the board sorts by orderFraction) */
const orderKeys = (n: number) => generateNKeysBetween(null, null, n);

async function main() {
  const { db } = await import('../src/db');
  const schema = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');
  const demo = await import('./guest-demo/demo-board');

  const { seedDemoAutomation } = await import('./guest-demo/seed-automation');

  const [guest] = await db
    .select({ id: schema.usersTable.id, fullName: schema.usersTable.fullName })
    .from(schema.usersTable)
    .where(eq(schema.usersTable.provider, 'guest'))
    .limit(1);
  if (!guest) {
    console.log(
      'No guest account yet (nobody has used guest sign-in). Nothing to reset.',
    );
    return;
  }
  const [org] = await db
    .select({
      id: schema.organizationsTable.id,
      timeZone: schema.organizationsTable.timeZone,
    })
    .from(schema.organizationsTable)
    .where(eq(schema.organizationsTable.createdBy, guest.id))
    .limit(1);

  const now = Date.now();
  const at = (days: number) => {
    const d = new Date(now + days * DAY_MS);
    d.setUTCHours(5, 0, 0, 0); // midday in Bangkok
    return d;
  };

  await db.transaction(async (tx) => {
    // boards, their columns, cards, subtasks, comments and members cascade
    const removed = await tx
      .delete(schema.projectsTable)
      .where(eq(schema.projectsTable.ownerId, guest.id))
      .returning({ id: schema.projectsTable.id });
    await tx
      .delete(schema.notificationsTable)
      .where(eq(schema.notificationsTable.userId, guest.id));

    const [board] = await tx
      .insert(schema.projectsTable)
      .values({
        organizationId: org?.id ?? null,
        name: demo.DEMO_BOARD_NAME,
        description: demo.DEMO_BOARD_DESCRIPTION,
        ownerId: guest.id,
        tags: Object.keys(demo.DEMO_LABELS),
        settings: {
          color: demo.DEMO_BOARD_COLOR,
          tagColors: demo.DEMO_LABELS,
        },
      })
      .returning({ id: schema.projectsTable.id });

    await tx
      .insert(schema.projectMembersTable)
      .values({ projectId: board.id, userId: guest.id, role: 'owner' });

    const columnKeys = orderKeys(demo.DEMO_COLUMNS.length);
    const columns = await tx
      .insert(schema.columnsTable)
      .values(
        demo.DEMO_COLUMNS.map((c, i) => ({
          projectId: board.id,
          name: c.name,
          color: c.color,
          orderFraction: columnKeys[i],
          isDone: i === demo.DEMO_COLUMNS.length - 1,
        })),
      )
      .returning({
        id: schema.columnsTable.id,
        name: schema.columnsTable.name,
      });
    const columnId = Object.fromEntries(columns.map((c) => [c.name, c.id]));

    const cardKeys = Object.fromEntries(
      demo.DEMO_COLUMNS.map((c) => [
        c.name,
        orderKeys(
          demo.DEMO_CARDS.filter((card) => card.column === c.name).length,
        ),
      ]),
    );
    const columnRef = (name: string) => {
      const column = demo.DEMO_COLUMNS.find((c) => c.name === name);
      return { id: columnId[name], name, color: column?.color ?? null };
    };
    const taskIdByTitle: Record<string, string> = {};
    const position: Record<string, number> = {};
    for (const card of demo.DEMO_CARDS) {
      const index = (position[card.column] = (position[card.column] ?? -1) + 1);
      const [task] = await tx
        .insert(schema.tasksTable)
        .values({
          columnId: columnId[card.column],
          title: card.title,
          description: card.description ?? null,
          priority: card.priority,
          tags: card.labels,
          dueDate: card.dueInDays === null ? null : at(card.dueInDays),
          orderFraction: cardKeys[card.column][index],
          commentCount: card.comments?.length ?? 0,
          ...(card.createdDaysAgo === undefined
            ? {}
            : { createdAt: at(-card.createdDaysAgo) }),
        })
        .returning({ id: schema.tasksTable.id });
      taskIdByTitle[card.title] = task.id;

      // where it started and when it got here, for Insights
      if (card.createdDaysAgo !== undefined) {
        const startedIn =
          card.movedDaysAgo === undefined ? card.column : 'Backlog';
        await tx.insert(schema.taskActivitiesTable).values([
          {
            taskId: task.id,
            actorId: guest.id,
            type: 'created' as const,
            data: { column: columnRef(startedIn) },
            createdAt: at(-card.createdDaysAgo),
          },
          ...(card.movedDaysAgo === undefined
            ? []
            : [
                {
                  taskId: task.id,
                  actorId: guest.id,
                  type: 'moved' as const,
                  data: {
                    from: columnRef('Backlog'),
                    to: columnRef(card.column),
                  },
                  createdAt: at(-card.movedDaysAgo),
                },
              ]),
        ]);
      }

      if (card.assigned) {
        await tx
          .insert(schema.taskAssigneesTable)
          .values({ taskId: task.id, userId: guest.id });
      }
      if (card.subtasks?.length) {
        const subtaskKeys = orderKeys(card.subtasks.length);
        await tx.insert(schema.subtasksTable).values(
          card.subtasks.map(([title, done], i) => ({
            taskId: task.id,
            title,
            completed: done,
            completedAt: done ? new Date(now) : null,
            orderFraction: subtaskKeys[i],
          })),
        );
      }
      if (card.comments?.length) {
        await tx.insert(schema.taskCommentsTable).values(
          card.comments.map((body, i) => ({
            taskId: task.id,
            userId: guest.id,
            body,
            // oldest first, a few minutes apart
            createdAt: new Date(now - (card.comments!.length - i) * 7 * 60_000),
          })),
        );
      }
    }

    const blocked = demo.DEMO_CARDS.filter((card) => card.blockedBy);
    if (blocked.length) {
      await tx.insert(schema.taskDependenciesTable).values(
        blocked.map((card) => ({
          taskId: taskIdByTitle[card.title],
          dependsOnTaskId: taskIdByTitle[card.blockedBy as string],
        })),
      );
    }

    // earlier weeks of finished work, archived: what Insights charts
    const historyKeys = generateNKeysBetween(
      cardKeys.Done.at(-1) ?? null,
      null,
      demo.DEMO_HISTORY.length,
    );
    for (const [
      i,
      [title, doneDaysAgo, backlog, todo, inProgress, review, dueAfterDone],
    ] of demo.DEMO_HISTORY.entries()) {
      const spent = [backlog, todo, inProgress, review];
      const doneAt = at(-doneDaysAgo);
      const total = spent.reduce((sum, days) => sum + days, 0);
      const createdAt = new Date(doneAt.getTime() - total * DAY_MS);
      const [task] = await tx
        .insert(schema.tasksTable)
        .values({
          columnId: columnId.Done,
          title,
          dueDate:
            dueAfterDone === undefined ? null : at(dueAfterDone - doneDaysAgo),
          orderFraction: historyKeys[i],
          archived: true,
          archivedAt: doneAt,
          archivedBy: guest.id,
          completedAt: doneAt,
          createdAt,
          updatedAt: doneAt,
        })
        .returning({ id: schema.tasksTable.id });
      await tx
        .insert(schema.taskAssigneesTable)
        .values({ taskId: task.id, userId: guest.id, createdAt });

      // created in the first lane it spent time in, then lane by lane to Done
      const lanes = demo.DEMO_LANES.filter((_, lane) => spent[lane] > 0);
      let enteredAt = createdAt.getTime();
      const steps = lanes.map((lane, step) => {
        const entry = { lane, from: lanes[step - 1], at: new Date(enteredAt) };
        enteredAt += spent[demo.DEMO_LANES.indexOf(lane)] * DAY_MS;
        return entry;
      });
      await tx.insert(schema.taskActivitiesTable).values([
        ...steps.map(({ lane, from, at: when }) =>
          from
            ? {
                taskId: task.id,
                actorId: guest.id,
                type: 'moved' as const,
                data: { from: columnRef(from), to: columnRef(lane) },
                createdAt: when,
              }
            : {
                taskId: task.id,
                actorId: guest.id,
                type: 'created' as const,
                data: { column: columnRef(lane) },
                createdAt: when,
              },
        ),
        {
          taskId: task.id,
          actorId: guest.id,
          type: 'moved' as const,
          data: {
            from: columnRef(lanes.at(-1) ?? 'Backlog'),
            to: columnRef('Done'),
          },
          createdAt: doneAt,
        },
      ]);
    }

    // rules, templates and what the rules did: the Automation view
    const automation = await seedDemoAutomation(tx, {
      projectId: board.id,
      guestId: guest.id,
      guestName: guest.fullName,
      timeZone: org?.timeZone ?? 'UTC',
      columnRef,
      taskIdByTitle,
      lastTodoKey: cardKeys['To do'].at(-1) ?? null,
      now: new Date(now),
      at,
    });

    console.log(
      `Removed ${removed.length} guest board(s); rebuilt "${demo.DEMO_BOARD_NAME}" with ${demo.DEMO_CARDS.length} cards, ${demo.DEMO_HISTORY.length} finished earlier, ${automation.rules} rules and ${automation.templates} templates.`,
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
