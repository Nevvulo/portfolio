"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { widgetInteractions } from "../schema";
import { requireUser } from "../auth";

/** Track a widget interaction (increment count). */
export async function trackWidgetInteraction(widgetId: string) {
  const user = await requireUser();

  await db
    .insert(widgetInteractions)
    .values({
      userId: user.id,
      widgetId,
      interactionCount: 1,
    })
    .onConflictDoUpdate({
      target: [widgetInteractions.userId, widgetInteractions.widgetId],
      set: {
        interactionCount: sql`${widgetInteractions.interactionCount} + 1`,
        lastInteractedAt: new Date(),
      },
    });
}
