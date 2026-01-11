import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check YouTube subscription renewal daily at 12:00 UTC
crons.daily(
  "youtube-subscription-renewal",
  { hourUTC: 12, minuteUTC: 0 },
  internal.youtube.checkSubscriptionRenewal
);

// Rebuild recommendation co-viewing matrix daily at 4am UTC
// Changed from hourly to save ~70-80% action compute
crons.daily(
  "rebuild-coviewing-matrix",
  { hourUTC: 4, minuteUTC: 0 },
  internal.recommendations.rebuildCoViewingMatrix
);

// Flush Redis watch time buffer to Convex every 5 minutes
// This syncs the buffered heartbeat data from Redis to the database
// Much more efficient than writing to Convex on every heartbeat
crons.interval(
  "flush-redis-watchtime",
  { minutes: 5 },
  internal.articleWatchTime.flushRedisBuffer
);

export default crons;
