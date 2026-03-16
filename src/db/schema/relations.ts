import { relations } from "drizzle-orm";
import { columnsTable } from "./column.table";
import { membershipsTable } from "./membership.table";
import { organizationsTable } from "./organization.table";
import { projectMembersTable } from "./project-member.table";
import { projectsTable } from "./project.table";
import { taskAssigneesTable } from "./task-assignee.table";
import { taskDependenciesTable } from "./task-dependency.table";
import { tasksTable } from "./task.table";
import { usersTable } from "./user.table";

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  createdOrganizations: many(organizationsTable),
  organizationMemberships: many(membershipsTable),
  ownedProjects: many(projectsTable),
  projectMemberships: many(projectMembersTable),
  taskAssignments: many(taskAssigneesTable),
}));

export const organizationsTableRelations = relations(
  organizationsTable,
  ({ one, many }) => ({
    creator: one(usersTable, {
      fields: [organizationsTable.createdBy],
      references: [usersTable.id],
    }),
    memberships: many(membershipsTable),
    projects: many(projectsTable),
  }),
);

export const membershipsTableRelations = relations(
  membershipsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [membershipsTable.userId],
      references: [usersTable.id],
    }),
    organization: one(organizationsTable, {
      fields: [membershipsTable.organizationId],
      references: [organizationsTable.id],
    }),
  }),
);

export const projectsTableRelations = relations(
  projectsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [projectsTable.organizationId],
      references: [organizationsTable.id],
    }),
    owner: one(usersTable, {
      fields: [projectsTable.ownerId],
      references: [usersTable.id],
    }),
    members: many(projectMembersTable),
    columns: many(columnsTable),
  }),
);

export const projectMembersTableRelations = relations(
  projectMembersTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [projectMembersTable.projectId],
      references: [projectsTable.id],
    }),
    user: one(usersTable, {
      fields: [projectMembersTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const columnsTableRelations = relations(
  columnsTable,
  ({ one, many }) => ({
    project: one(projectsTable, {
      fields: [columnsTable.projectId],
      references: [projectsTable.id],
    }),
    tasks: many(tasksTable),
  }),
);

export const tasksTableRelations = relations(tasksTable, ({ one, many }) => ({
  column: one(columnsTable, {
    fields: [tasksTable.columnId],
    references: [columnsTable.id],
  }),
  assignees: many(taskAssigneesTable),
  dependencies: many(taskDependenciesTable, {
    relationName: "task_dependencies",
  }),
  dependentTasks: many(taskDependenciesTable, {
    relationName: "task_dependents",
  }),
}));

export const taskAssigneesTableRelations = relations(
  taskAssigneesTable,
  ({ one }) => ({
    task: one(tasksTable, {
      fields: [taskAssigneesTable.taskId],
      references: [tasksTable.id],
    }),
    user: one(usersTable, {
      fields: [taskAssigneesTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const taskDependenciesTableRelations = relations(
  taskDependenciesTable,
  ({ one }) => ({
    task: one(tasksTable, {
      relationName: "task_dependencies",
      fields: [taskDependenciesTable.taskId],
      references: [tasksTable.id],
    }),
    dependsOn: one(tasksTable, {
      relationName: "task_dependents",
      fields: [taskDependenciesTable.dependsOnTaskId],
      references: [tasksTable.id],
    }),
  }),
);
