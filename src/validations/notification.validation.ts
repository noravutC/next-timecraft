import { z } from 'zod';

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.guid()).max(100).optional(),
  all: z.boolean().optional(),
});

export type MarkNotificationsReadBody = z.infer<
  typeof markNotificationsReadSchema
>;

export const notificationIdsSchema = z.object({
  ids: z.array(z.guid()).min(1).max(100),
});

export type NotificationIdsBody = z.infer<typeof notificationIdsSchema>;
