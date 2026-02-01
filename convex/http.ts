import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const http = httpRouter();

// Netvulo webhook endpoint
// POST /netvulo/webhook
http.route({
  path: "/netvulo/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = process.env.NETVULO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const body = await request.json();

      // Validate required fields
      if (!body.event_type || !body.event_id || !body.source) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: event_type, event_id, source" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Call the internal mutation to process the event
      await ctx.runMutation(internal.netvulo.handleWebhook, {
        eventType: body.event_type,
        eventId: body.event_id,
        source: body.source,
        data: body.data ?? {},
        timestamp: body.timestamp ?? Date.now(),
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Netvulo webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Health check for the webhook endpoint
http.route({
  path: "/netvulo/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", service: "netvulo-webhook" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ============================================
// ROBLOX SUBSCRIPTION LOOKUP (for Netvulo/GolfQuest)
// ============================================

// Get subscription status by Roblox user ID
// GET /roblox/subscription/:robloxUserId
http.route({
  path: "/roblox/subscription",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify API key (optional - for production, add authentication)
    const apiKey = process.env.ROBLOX_API_SECRET;
    if (apiKey) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${apiKey}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Get robloxUserId from query params
    const url = new URL(request.url);
    const robloxUserId = url.searchParams.get("robloxUserId");

    if (!robloxUserId) {
      return new Response(
        JSON.stringify({ error: "Missing robloxUserId query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const result = await ctx.runQuery(api.roblox.getSubscriptionByRobloxId, {
        robloxUserId,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60", // Cache for 1 minute
        },
      });
    } catch (error) {
      console.error("Roblox subscription lookup error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
