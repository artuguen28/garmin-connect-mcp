import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { garminService } from "./garminClient.js";

function formatActivities(activities: any[], activityType?: string): any[] {
  if (!activityType || activityType === "all") {
    return activities;
  }

  return activities.filter((activity) => {
    const typeKey = String(activity?.activityType?.typeKey ?? "").toLowerCase();
    return typeKey.includes(activityType.toLowerCase());
  });
}

export function registerGarminTools(server: McpServer): void {
  server.registerTool(
    "get_recent_activities",
    {
      description: "Get recent Garmin activities.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10),
        activityType: z
          .enum(["all", "running", "cycling", "walking", "hiking", "swimming"])
          .default("all"),
      },
    },
    async ({ limit, activityType }) => {
      const activities = (await garminService.getRecentActivities(limit)) as any[];
      const filtered = formatActivities(activities, activityType);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              filtered.map((activity) => ({
                activityId: activity.activityId,
                name: activity.activityName,
                type: activity.activityType?.typeKey,
                startTimeLocal: activity.startTimeLocal,
                distanceMeters: activity.distance,
                durationSeconds: activity.duration,
                calories: activity.calories,
                averageHeartRate: activity.averageHR,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_activity_detail",
    {
      description: "Get details for a Garmin activity by activityId.",
      inputSchema: {
        activityId: z.number().int().positive(),
      },
    },
    async ({ activityId }) => {
      const detail = await garminService.getActivityDetail(activityId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(detail, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_daily_metrics",
    {
      description: "Get daily Garmin metrics (steps, heart rate, sleep) for a date.",
      inputSchema: {
        date: z.iso.date().optional(),
      },
    },
    async ({ date }) => {
      const targetDate = date ? new Date(`${date}T00:00:00`) : new Date();
      const metrics = await garminService.getDailyMetrics(targetDate);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(metrics, null, 2),
          },
        ],
      };
    },
  );
}
